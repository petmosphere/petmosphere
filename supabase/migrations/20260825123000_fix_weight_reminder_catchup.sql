create or replace function public.claim_due_pet_weight_reminders(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns table (owner_id uuid, pet_id uuid)
language sql
security definer
set search_path = ''
as $$
  with due as materialized (
    select
      reminder.owner_id,
      reminder.pet_id,
      reminder.frequency,
      reminder.schedule_day,
      reminder.next_due_local_date,
      (p_now at time zone reminder.timezone)::date as current_local_date,
      not exists (
        select 1 from public.pet_weight_entries as entry
        where entry.owner_id = reminder.owner_id
          and entry.pet_id = reminder.pet_id
          and entry.local_date = (p_now at time zone reminder.timezone)::date
      ) as should_notify
    from public.pet_weight_reminders as reminder
    where reminder.enabled
      and reminder.next_due_local_date <= (p_now at time zone reminder.timezone)::date
      and reminder.local_time <= (p_now at time zone reminder.timezone)::time
      and exists (
        select 1 from public.web_push_subscriptions as subscription
        where subscription.owner_id = reminder.owner_id
      )
    order by reminder.next_due_local_date, reminder.owner_id, reminder.pet_id
    for update of reminder skip locked
    limit least(greatest(p_limit, 1), 500)
  ), advanced as (
    update public.pet_weight_reminders as reminder
    set
      last_notified_at = case when due.should_notify then p_now else reminder.last_notified_at end,
      next_due_local_date = case due.frequency
        when 'weekly' then due.next_due_local_date
          + (((due.current_local_date - due.next_due_local_date) / 7) + 1) * 7
        when 'fortnightly' then due.next_due_local_date
          + (((due.current_local_date - due.next_due_local_date) / 14) + 1) * 14
        when 'monthly' then (
          select min(candidate.local_date)
          from generate_series(1, 600) as occurrence(number)
          cross join lateral (
            select (
              date_trunc(
                'month',
                due.next_due_local_date::timestamp
                  + occurrence.number * interval '1 month'
              )
              + (
                least(
                  due.schedule_day,
                  extract(day from (
                    date_trunc(
                      'month',
                      due.next_due_local_date::timestamp
                        + (occurrence.number + 1) * interval '1 month'
                    ) - interval '1 day'
                  ))::integer
                ) - 1
              ) * interval '1 day'
            )::date as local_date
          ) as candidate
          where candidate.local_date > due.current_local_date
        )
        else (
          select min(candidate.local_date)
          from generate_series(1, 200) as occurrence(number)
          cross join lateral (
            select (
              date_trunc(
                'month',
                due.next_due_local_date::timestamp
                  + occurrence.number * interval '3 months'
              )
              + (
                least(
                  due.schedule_day,
                  extract(day from (
                    date_trunc(
                      'month',
                      due.next_due_local_date::timestamp
                        + (occurrence.number * 3 + 1) * interval '1 month'
                    ) - interval '1 day'
                  ))::integer
                ) - 1
              ) * interval '1 day'
            )::date as local_date
          ) as candidate
          where candidate.local_date > due.current_local_date
        )
      end
    from due
    where reminder.owner_id = due.owner_id and reminder.pet_id = due.pet_id
    returning reminder.owner_id, reminder.pet_id, due.should_notify
  )
  select advanced.owner_id, advanced.pet_id
  from advanced
  where advanced.should_notify;
$$;
