comment on column public.profiles.reminder_notifications_enabled is
  'Whether pet-care reminder due notifications are generated for the inbox and eligible push subscriptions.';

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
    where reminder.completed_at is null
      and reminder.deleted_at is null
      and reminder.notified_at is null
      and reminder.notification_lead_minutes is not null
      and profile.reminder_notifications_enabled
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
