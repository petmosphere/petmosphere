alter table public.profiles
add column reminder_notifications_enabled boolean not null default true,
add column reminder_alert_lead_days smallint not null default 0 check (
  reminder_alert_lead_days in (0, 1, 2, 3, 7)
);

comment on column public.profiles.reminder_notifications_enabled is
  'Whether pet-care reminder occurrences may generate push notifications.';
comment on column public.profiles.reminder_alert_lead_days is
  'Number of local calendar days before a pet-care reminder to send its push notification.';

create or replace function public.claim_due_reminders(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns table (reminder_id uuid, owner_id uuid)
language sql
security definer
set search_path = ''
as $$
  with due as materialized (
    select reminder.id, reminder.owner_id
    from public.reminders as reminder
    join public.profiles as profile on profile.id = reminder.owner_id
    where reminder.completed_at is null
      and reminder.deleted_at is null
      and reminder.notified_at is null
      and profile.reminder_notifications_enabled
      and (
        reminder.due_local_date - profile.reminder_alert_lead_days
          < (p_now at time zone reminder.timezone)::date
        or (
          reminder.due_local_date - profile.reminder_alert_lead_days
            = (p_now at time zone reminder.timezone)::date
          and reminder.local_time <= (p_now at time zone reminder.timezone)::time
        )
      )
      and exists (
        select 1 from public.web_push_subscriptions as subscription
        where subscription.owner_id = reminder.owner_id
      )
    order by reminder.due_local_date, reminder.local_time, reminder.id
    for update of reminder skip locked
    limit least(greatest(p_limit, 1), 500)
  ), claimed as (
    update public.reminders as reminder
    set notified_at = p_now
    from due
    where reminder.id = due.id
    returning reminder.id, reminder.owner_id
  )
  select claimed.id, claimed.owner_id from claimed;
$$;

revoke all on function public.claim_due_reminders(timestamptz, integer)
from public, anon, authenticated;
grant execute on function public.claim_due_reminders(timestamptz, integer)
to service_role;
