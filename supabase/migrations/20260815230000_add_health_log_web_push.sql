alter table public.health_log_reminders
add column last_notified_local_date date;

comment on table public.health_log_reminders is
  'Owner reminder preferences and the last locally notified date. Push delivery skips dates that already have a health log.';

create table public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (
    char_length(endpoint) between 1 and 2048
    and endpoint like 'https://%'
  ),
  p256dh text not null check (char_length(p256dh) between 1 and 512),
  auth text not null check (char_length(auth) between 1 and 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.web_push_subscriptions is
  'Private browser push endpoints and encryption keys. Retained until revoked, expired, reassigned on the same browser, or account deletion.';

alter table public.web_push_subscriptions enable row level security;
revoke all on table public.web_push_subscriptions from anon, authenticated;
grant select, delete on table public.web_push_subscriptions to authenticated;

create policy "web_push_subscriptions_select_own"
on public.web_push_subscriptions
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "web_push_subscriptions_delete_own"
on public.web_push_subscriptions
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create trigger web_push_subscriptions_set_updated_at
before update on public.web_push_subscriptions
for each row execute function public.set_profile_updated_at();

create function public.save_web_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_endpoint not like 'https://%'
    or char_length(p_endpoint) not between 1 and 2048
    or char_length(p_p256dh) not between 1 and 512
    or char_length(p_auth) not between 1 and 512 then
    raise exception 'Invalid push subscription.' using errcode = '22023';
  end if;

  insert into public.web_push_subscriptions (
    owner_id,
    endpoint,
    p256dh,
    auth
  ) values (
    current_owner_id,
    p_endpoint,
    p_p256dh,
    p_auth
  )
  on conflict (endpoint) do update set
    owner_id = excluded.owner_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    updated_at = now();
end;
$$;

revoke all on function public.save_web_push_subscription(text, text, text)
from public, anon;
grant execute on function public.save_web_push_subscription(text, text, text)
to authenticated;

create function public.claim_due_health_log_reminders(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns table (
  owner_id uuid,
  pet_id uuid,
  local_date date
)
language sql
security definer
set search_path = ''
as $$
  with due as materialized (
    select
      reminder.owner_id,
      reminder.pet_id,
      (p_now at time zone reminder.timezone)::date as local_date
    from public.health_log_reminders as reminder
    where reminder.enabled
      and (p_now at time zone reminder.timezone)::time >= reminder.local_time
      and (
        reminder.last_notified_local_date is null
        or reminder.last_notified_local_date
          < (p_now at time zone reminder.timezone)::date
      )
      and exists (
        select 1
        from public.web_push_subscriptions as subscription
        where subscription.owner_id = reminder.owner_id
      )
      and not exists (
        select 1
        from public.health_logs as health_log
        where health_log.owner_id = reminder.owner_id
          and health_log.pet_id = reminder.pet_id
          and health_log.local_date
            = (p_now at time zone reminder.timezone)::date
      )
    order by reminder.updated_at, reminder.owner_id, reminder.pet_id
    for update of reminder skip locked
    limit least(greatest(p_limit, 1), 500)
  ), claimed as (
    update public.health_log_reminders as reminder
    set last_notified_local_date = due.local_date
    from due
    where reminder.owner_id = due.owner_id
      and reminder.pet_id = due.pet_id
    returning
      reminder.owner_id,
      reminder.pet_id,
      reminder.last_notified_local_date
  )
  select
    claimed.owner_id,
    claimed.pet_id,
    claimed.last_notified_local_date as local_date
  from claimed;
$$;

revoke all on function public.claim_due_health_log_reminders(timestamptz, integer)
from public, anon, authenticated;
grant execute on function public.claim_due_health_log_reminders(timestamptz, integer)
to service_role;
