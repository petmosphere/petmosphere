create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  reminder_id uuid references public.reminders(id) on delete set null,
  kind text not null check (kind in (
    'reminder_due', 'daily_check_in', 'weight_log', 'reminder_completed'
  )),
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 240),
  local_date date,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 180),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, dedupe_key)
);

comment on table public.notifications is
  'Private in-app inbox. The UI shows 60 days; records retain for six months.';

create index notifications_owner_created_idx
on public.notifications (owner_id, created_at desc);
create index notifications_owner_unread_idx
on public.notifications (owner_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy "notifications_select_own"
on public.notifications for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "notifications_update_own"
on public.notifications for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create or replace function public.record_reminder_completion_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.completed_at is null and new.completed_at is not null then
    insert into public.notifications (
      owner_id, pet_id, reminder_id, kind, title, message, dedupe_key, created_at
    ) values (
      new.owner_id, new.pet_id, new.id, 'reminder_completed',
      new.title || ' Done', 'You marked this reminder as complete.',
      'reminder_completed:' || new.id::text, new.completed_at
    ) on conflict (owner_id, dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.record_reminder_completion_notification()
from public, anon, authenticated;

create trigger reminders_record_completion_notification
after update of completed_at on public.reminders
for each row execute function public.record_reminder_completion_notification();

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
    join public.profiles as profile on profile.id = reminder.owner_id
    where reminder.completed_at is null and reminder.deleted_at is null
      and reminder.notified_at is null
      and (
        reminder.due_local_date - profile.reminder_alert_lead_days
          < (p_now at time zone reminder.timezone)::date
        or (
          reminder.due_local_date - profile.reminder_alert_lead_days
            = (p_now at time zone reminder.timezone)::date
          and reminder.local_time <= (p_now at time zone reminder.timezone)::time
        )
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

create or replace function public.claim_due_health_log_reminders(
  p_now timestamptz default now(), p_limit integer default 100
)
returns table (owner_id uuid, pet_id uuid, local_date date)
language sql security definer set search_path = ''
as $$
  with due as materialized (
    select reminder.owner_id, reminder.pet_id,
      (p_now at time zone reminder.timezone)::date as local_date
    from public.health_log_reminders as reminder
    where reminder.enabled
      and (p_now at time zone reminder.timezone)::time >= reminder.local_time
      and (reminder.last_notified_local_date is null or reminder.last_notified_local_date
        < (p_now at time zone reminder.timezone)::date)
      and not exists (
        select 1 from public.health_logs as health_log
        where health_log.owner_id = reminder.owner_id
          and health_log.pet_id = reminder.pet_id
          and health_log.local_date = (p_now at time zone reminder.timezone)::date
      )
    order by reminder.updated_at, reminder.owner_id, reminder.pet_id
    for update of reminder skip locked
    limit least(greatest(p_limit, 1), 500)
  ), claimed as (
    update public.health_log_reminders as reminder
    set last_notified_local_date = due.local_date from due
    where reminder.owner_id = due.owner_id and reminder.pet_id = due.pet_id
    returning reminder.owner_id, reminder.pet_id,
      reminder.last_notified_local_date as local_date
  ), recorded as (
    insert into public.notifications (
      owner_id, pet_id, kind, title, message, local_date, dedupe_key, created_at
    )
    select claimed.owner_id, claimed.pet_id, 'daily_check_in', 'Daily Check-in',
      'How is your pet doing today? Log a quick mood check.', claimed.local_date,
      'daily_check_in:' || claimed.pet_id::text || ':' || claimed.local_date::text,
      p_now
    from claimed on conflict (owner_id, dedupe_key) do nothing returning id
  )
  select claimed.owner_id, claimed.pet_id, claimed.local_date from claimed;
$$;

create or replace function public.claim_due_pet_weight_reminders(
  p_now timestamptz default now(), p_limit integer default 100
)
returns table (owner_id uuid, pet_id uuid)
language sql security definer set search_path = ''
as $$
  with due as materialized (
    select reminder.owner_id, reminder.pet_id, reminder.frequency,
      reminder.schedule_day, reminder.next_due_local_date,
      (p_now at time zone reminder.timezone)::date as current_local_date,
      not exists (
        select 1 from public.pet_weight_entries as entry
        where entry.owner_id = reminder.owner_id and entry.pet_id = reminder.pet_id
          and entry.local_date = (p_now at time zone reminder.timezone)::date
      ) as should_notify
    from public.pet_weight_reminders as reminder
    where reminder.enabled
      and reminder.next_due_local_date <= (p_now at time zone reminder.timezone)::date
      and reminder.local_time <= (p_now at time zone reminder.timezone)::time
    order by reminder.next_due_local_date, reminder.owner_id, reminder.pet_id
    for update of reminder skip locked
    limit least(greatest(p_limit, 1), 500)
  ), advanced as (
    update public.pet_weight_reminders as reminder
    set last_notified_at = case when due.should_notify then p_now else reminder.last_notified_at end,
      next_due_local_date = case due.frequency
        when 'weekly' then due.next_due_local_date
          + (((due.current_local_date - due.next_due_local_date) / 7) + 1) * 7
        when 'fortnightly' then due.next_due_local_date
          + (((due.current_local_date - due.next_due_local_date) / 14) + 1) * 14
        when 'monthly' then (
          select min(candidate.local_date) from generate_series(1, 600) as occurrence(number)
          cross join lateral (select (date_trunc('month', due.next_due_local_date::timestamp
            + occurrence.number * interval '1 month') + (least(due.schedule_day,
            extract(day from (date_trunc('month', due.next_due_local_date::timestamp
            + (occurrence.number + 1) * interval '1 month') - interval '1 day'))::integer)
            - 1) * interval '1 day')::date as local_date) as candidate
          where candidate.local_date > due.current_local_date
        )
        else (
          select min(candidate.local_date) from generate_series(1, 200) as occurrence(number)
          cross join lateral (select (date_trunc('month', due.next_due_local_date::timestamp
            + occurrence.number * interval '3 months') + (least(due.schedule_day,
            extract(day from (date_trunc('month', due.next_due_local_date::timestamp
            + (occurrence.number * 3 + 1) * interval '1 month') - interval '1 day'))::integer)
            - 1) * interval '1 day')::date as local_date) as candidate
          where candidate.local_date > due.current_local_date
        )
      end
    from due
    where reminder.owner_id = due.owner_id and reminder.pet_id = due.pet_id
    returning reminder.owner_id, reminder.pet_id, due.should_notify, due.current_local_date
  ), recorded as (
    insert into public.notifications (
      owner_id, pet_id, kind, title, message, local_date, dedupe_key, created_at
    )
    select advanced.owner_id, advanced.pet_id, 'weight_log', 'Weight Log Reminder',
      'It is time to record your pet''s weight.', advanced.current_local_date,
      'weight_log:' || advanced.pet_id::text || ':' || advanced.current_local_date::text,
      p_now
    from advanced where advanced.should_notify
    on conflict (owner_id, dedupe_key) do nothing returning id
  )
  select advanced.owner_id, advanced.pet_id
  from advanced where advanced.should_notify;
$$;
