drop index if exists public.reminders_one_active_occurrence_per_series;

create unique index reminders_one_active_occurrence_per_series_date
on public.reminders (series_id, due_local_date)
where completed_at is null and deleted_at is null;

comment on index public.reminders_one_active_occurrence_per_series_date is
  'Allows an overdue occurrence and its next future occurrence to remain active while preventing duplicate active dates.';

create or replace function public.list_overdue_recurring_reminders(
  p_now timestamptz default now(), p_limit integer default 100
)
returns table (
  reminder_id uuid,
  series_start_date date,
  repeat_rule text,
  timezone text
)
language sql
security definer
set search_path = ''
as $$
  with latest_overdue as (
    select distinct on (reminder.series_id)
      reminder.id,
      reminder.series_id,
      reminder.series_start_date,
      reminder.repeat_rule,
      reminder.timezone,
      reminder.due_local_date,
      reminder.local_time
    from public.reminders as reminder
    where reminder.completed_at is null
      and reminder.deleted_at is null
      and reminder.repeat_rule <> 'never'
      and reminder.due_local_date + reminder.local_time
        < (p_now at time zone reminder.timezone)::timestamp
    order by reminder.series_id, reminder.due_local_date desc,
      reminder.local_time desc, reminder.id
  )
  select overdue.id, overdue.series_start_date, overdue.repeat_rule,
    overdue.timezone
  from latest_overdue as overdue
  where not exists (
    select 1
    from public.reminders as future
    where future.series_id = overdue.series_id
      and future.completed_at is null
      and future.deleted_at is null
      and (
        future.due_local_date > overdue.due_local_date
        or (
          future.due_local_date = overdue.due_local_date
          and future.local_time > overdue.local_time
        )
      )
  )
  order by overdue.due_local_date, overdue.local_time, overdue.id
  limit least(greatest(p_limit, 1), 500);
$$;

revoke all on function public.list_overdue_recurring_reminders(
  timestamptz, integer
) from public, anon, authenticated;
grant execute on function public.list_overdue_recurring_reminders(
  timestamptz, integer
) to service_role;

create or replace function public.create_next_reminder_occurrence(
  p_reminder_id uuid,
  p_next_due_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_reminder public.reminders%rowtype;
  created_next_id uuid;
begin
  select * into current_reminder
  from public.reminders
  where id = p_reminder_id
  for update;

  if not found
    or current_reminder.completed_at is not null
    or current_reminder.deleted_at is not null
    or current_reminder.repeat_rule = 'never'
    or p_next_due_date <= current_reminder.due_local_date then
    return null;
  end if;

  select id into created_next_id
  from public.reminders
  where series_id = current_reminder.series_id
    and completed_at is null
    and deleted_at is null
    and due_local_date > current_reminder.due_local_date
  order by due_local_date, local_time, id
  limit 1;

  if created_next_id is not null then
    return created_next_id;
  end if;

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
  )
  on conflict (series_id, due_local_date)
    where completed_at is null and deleted_at is null
  do nothing
  returning id into created_next_id;

  if created_next_id is null then
    select id into created_next_id
    from public.reminders
    where series_id = current_reminder.series_id
      and due_local_date = p_next_due_date
      and completed_at is null
      and deleted_at is null
    limit 1;
  end if;

  return created_next_id;
end;
$$;

revoke all on function public.create_next_reminder_occurrence(uuid, date)
from public, anon, authenticated;
grant execute on function public.create_next_reminder_occurrence(uuid, date)
to service_role;

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

    select id into created_next_id
    from public.reminders
    where series_id = current_reminder.series_id
      and completed_at is null
      and deleted_at is null
      and due_local_date > current_reminder.due_local_date
    order by due_local_date, local_time, id
    limit 1;

    if created_next_id is null
      and p_next_due_date is not null
      and current_reminder.repeat_rule <> 'never' then
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
      )
      on conflict (series_id, due_local_date)
        where completed_at is null and deleted_at is null
      do nothing
      returning id into created_next_id;
    end if;
  end if;

  return query select current_reminder.id, created_next_id;
end;
$$;

revoke all on function public.complete_reminder(uuid, date)
from public, anon;
grant execute on function public.complete_reminder(uuid, date)
to authenticated;
