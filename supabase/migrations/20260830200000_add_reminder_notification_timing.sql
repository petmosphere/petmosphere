alter table public.reminders
add column notification_lead_minutes smallint default 0;

alter table public.reminders
add constraint reminders_notification_lead_minutes_check check (
  notification_lead_minutes is null
  or notification_lead_minutes in (0, 5, 15, 30, 60, 120, 1440, 2880, 10080, 43200)
);

update public.reminders as reminder
set notification_lead_minutes = profile.reminder_alert_lead_days * 1440
from public.profiles as profile
where profile.id = reminder.owner_id;

comment on column public.reminders.notification_lead_minutes is
  'Minutes before the local due time to create an in-app and push notification; null disables this reminder alert.';

create or replace function public.complete_reminder(
  p_reminder_id uuid,
  p_next_due_date date default null
)
returns table (completed_id uuid, next_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  current_reminder public.reminders%rowtype;
  created_next_id uuid;
begin
  if current_owner_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into current_reminder
  from public.reminders
  where id = p_reminder_id and owner_id = current_owner_id
  for update;

  if not found or current_reminder.deleted_at is not null then
    return;
  end if;

  if current_reminder.completed_at is null then
    update public.reminders
    set completed_at = now()
    where id = current_reminder.id;

    if p_next_due_date is not null and current_reminder.repeat_rule <> 'never' then
      insert into public.reminders (
        series_id, owner_id, pet_id, creation_request_id, category, title,
        due_local_date, local_time, timezone, repeat_rule, series_start_date,
        note, notification_lead_minutes
      ) values (
        current_reminder.series_id, current_reminder.owner_id,
        current_reminder.pet_id, gen_random_uuid(), current_reminder.category,
        current_reminder.title, p_next_due_date, current_reminder.local_time,
        current_reminder.timezone, current_reminder.repeat_rule,
        current_reminder.series_start_date, current_reminder.note,
        current_reminder.notification_lead_minutes
      ) returning id into created_next_id;
    end if;
  end if;

  return query select current_reminder.id, created_next_id;
end;
$$;

create or replace function public.claim_due_reminders(
  p_now timestamptz default now(), p_limit integer default 100
)
returns table (reminder_id uuid, owner_id uuid)
language sql security definer set search_path = ''
as $$
  with expired as (
    delete from public.notifications
    where created_at < p_now - interval '6 months'
    returning id
  ), due as materialized (
    select reminder.id, reminder.owner_id
    from public.reminders as reminder
    where reminder.completed_at is null
      and reminder.deleted_at is null
      and reminder.notified_at is null
      and reminder.notification_lead_minutes is not null
      and (
        reminder.due_local_date + reminder.local_time
          - reminder.notification_lead_minutes * interval '1 minute'
          <= (p_now at time zone reminder.timezone)::timestamp
      )
    order by reminder.due_local_date, reminder.local_time, reminder.id
    for update of reminder skip locked
    limit least(greatest(p_limit, 1), 500)
  ), claimed as (
    update public.reminders as reminder set notified_at = p_now
    from due where reminder.id = due.id
    returning reminder.id, reminder.owner_id, reminder.pet_id, reminder.title
  ), recorded as (
    insert into public.notifications (
      owner_id, pet_id, reminder_id, kind, title, message, dedupe_key, created_at
    )
    select claimed.owner_id, claimed.pet_id, claimed.id, 'reminder_due',
      claimed.title || ' Due', 'A pet care reminder is coming up.',
      'reminder_due:' || claimed.id::text, p_now
    from claimed on conflict (owner_id, dedupe_key) do nothing returning id
  )
  select claimed.id, claimed.owner_id from claimed;
$$;
