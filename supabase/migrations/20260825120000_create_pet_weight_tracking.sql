create table public.pet_weight_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null,
  local_date date not null,
  derivation_timezone text not null default 'Australia/Melbourne'
    check (derivation_timezone = 'Australia/Melbourne'),
  weight_kg numeric(6, 2) not null check (weight_kg > 0 and weight_kg <= 300),
  source text not null default 'web' check (source = 'web'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pet_id, owner_id)
    references public.pets (id, owner_id) on delete cascade,
  unique (pet_id, local_date)
);

comment on table public.pet_weight_entries is
  'Private owner-scoped pet weight history. The server derives Melbourne local_date.';

create index pet_weight_entries_owner_pet_date_idx
on public.pet_weight_entries (owner_id, pet_id, local_date desc);

alter table public.pet_weight_entries enable row level security;
revoke all on table public.pet_weight_entries from anon, authenticated;
grant select, insert, update on table public.pet_weight_entries to authenticated;

create policy "pet_weight_entries_select_own"
on public.pet_weight_entries for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "pet_weight_entries_insert_own"
on public.pet_weight_entries for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "pet_weight_entries_update_own"
on public.pet_weight_entries for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create trigger pet_weight_entries_set_updated_at
before update on public.pet_weight_entries
for each row execute function public.set_profile_updated_at();

create function public.sync_pet_weight_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pets
  set weight_kg = new.weight_kg
  where id = new.pet_id and owner_id = new.owner_id;
  return new;
end;
$$;

revoke all on function public.sync_pet_weight_snapshot() from public, anon;

create trigger pet_weight_entries_sync_pet
after insert or update of weight_kg on public.pet_weight_entries
for each row execute function public.sync_pet_weight_snapshot();

create table public.pet_weight_reminders (
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null,
  enabled boolean not null default false,
  frequency text not null default 'weekly' check (
    frequency in ('weekly', 'fortnightly', 'monthly', 'quarterly')
  ),
  schedule_day smallint not null default 0 check (schedule_day between 0 and 31),
  local_time time not null default '20:00',
  timezone text not null default 'Australia/Melbourne'
    check (timezone = 'Australia/Melbourne'),
  next_due_local_date date not null,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, pet_id),
  foreign key (pet_id, owner_id)
    references public.pets (id, owner_id) on delete cascade,
  check (
    (frequency in ('weekly', 'fortnightly') and schedule_day between 0 and 6)
    or (frequency in ('monthly', 'quarterly') and schedule_day between 1 and 31)
  )
);

comment on table public.pet_weight_reminders is
  'Private recurring weight reminder preferences. Push copy contains no weight value.';

alter table public.pet_weight_reminders enable row level security;
revoke all on table public.pet_weight_reminders from anon, authenticated;
grant select, insert, update on table public.pet_weight_reminders to authenticated;

create policy "pet_weight_reminders_select_own"
on public.pet_weight_reminders for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "pet_weight_reminders_insert_own"
on public.pet_weight_reminders for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "pet_weight_reminders_update_own"
on public.pet_weight_reminders for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create trigger pet_weight_reminders_set_updated_at
before update on public.pet_weight_reminders
for each row execute function public.set_profile_updated_at();

create function public.claim_due_pet_weight_reminders(
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
        when 'weekly' then due.next_due_local_date + 7
        when 'fortnightly' then due.next_due_local_date + 14
        when 'monthly' then (
          date_trunc('month', due.next_due_local_date + interval '1 month')
          + (
            least(
              due.schedule_day,
              extract(day from date_trunc('month', due.next_due_local_date + interval '2 months') - interval '1 day')::integer
            ) - 1
          ) * interval '1 day'
        )::date
        else (
          date_trunc('month', due.next_due_local_date + interval '3 months')
          + (
            least(
              due.schedule_day,
              extract(day from date_trunc('month', due.next_due_local_date + interval '4 months') - interval '1 day')::integer
            ) - 1
          ) * interval '1 day'
        )::date
      end
    from due
    where reminder.owner_id = due.owner_id and reminder.pet_id = due.pet_id
    returning reminder.owner_id, reminder.pet_id, due.should_notify
  )
  select advanced.owner_id, advanced.pet_id
  from advanced
  where advanced.should_notify;
$$;

revoke all on function public.claim_due_pet_weight_reminders(timestamptz, integer)
from public, anon, authenticated;
grant execute on function public.claim_due_pet_weight_reminders(timestamptz, integer)
to service_role;
