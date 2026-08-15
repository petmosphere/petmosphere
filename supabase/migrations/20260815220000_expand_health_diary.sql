alter table public.health_logs
add column observations text[] not null default '{}';

alter table public.health_logs
add constraint health_logs_observations_valid check (
  cardinality(observations) <= 6
  and array_position(observations, null) is null
  and observations <@ array[
    'ate_well',
    'playful',
    'ate_less',
    'low_energy',
    'vomited',
    'diarrhoea'
  ]::text[]
  and case status
    when 'doing_well' then observations <@ array['ate_well', 'playful']::text[]
    when 'something_different' then observations <@ array['ate_less', 'low_energy']::text[]
    when 'concerned' then observations <@ array['vomited', 'diarrhoea']::text[]
    else false
  end
);

comment on column public.health_logs.observations is
  'Optional owner-selected observations associated with the selected non-diagnostic emotion.';

grant delete on table public.health_logs to authenticated;

create policy "health_logs_delete_own"
on public.health_logs
for delete
to authenticated
using ((select auth.uid()) = owner_id);

alter table public.health_log_analytics_events
drop constraint health_log_analytics_events_optional_field_count_check;

alter table public.health_log_analytics_events
add constraint health_log_analytics_events_optional_field_count_check
check (optional_field_count between 0 and 3);

create table public.health_log_reminders (
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null,
  enabled boolean not null default false,
  local_time time not null default '19:00',
  timezone text not null check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, pet_id),
  constraint health_log_reminders_pet_membership foreign key (pet_id, owner_id)
    references public.pets (id, owner_id) on delete cascade
);

comment on table public.health_log_reminders is
  'Owner reminder preferences. Delivery requires a separately configured notification channel.';

alter table public.health_log_reminders enable row level security;
revoke all on table public.health_log_reminders from anon, authenticated;
grant select, insert, update, delete on table public.health_log_reminders
to authenticated;

create policy "health_log_reminders_select_own"
on public.health_log_reminders
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "health_log_reminders_insert_own"
on public.health_log_reminders
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "health_log_reminders_update_own"
on public.health_log_reminders
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "health_log_reminders_delete_own"
on public.health_log_reminders
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create trigger health_log_reminders_set_updated_at
before update on public.health_log_reminders
for each row execute function public.set_profile_updated_at();
