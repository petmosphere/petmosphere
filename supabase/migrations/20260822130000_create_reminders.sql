alter table public.pets
add constraint pets_id_owner_id_unique unique (id, owner_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null,
  creation_request_id uuid not null,
  category text not null check (
    category in ('vaccination', 'medication', 'vet_visit', 'grooming', 'other')
  ),
  title text not null check (
    title = btrim(title) and char_length(title) between 1 and 100
  ),
  due_local_date date not null,
  local_time time not null,
  timezone text not null default 'Australia/Melbourne'
    check (timezone = 'Australia/Melbourne'),
  repeat_rule text not null default 'never' check (
    repeat_rule in ('never', 'daily', 'weekly', 'fortnightly', 'monthly', 'yearly')
  ),
  series_start_date date not null,
  note text check (note is null or char_length(note) between 1 and 1000),
  completed_at timestamptz,
  notified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pet_id, owner_id) references public.pets (id, owner_id) on delete cascade,
  unique (owner_id, creation_request_id)
);

comment on table public.reminders is
  'Private pet reminder occurrences. Completed rows retain history; one active row advances a recurring series.';

create index reminders_owner_due_idx
on public.reminders (owner_id, due_local_date, local_time)
where completed_at is null and deleted_at is null;

create unique index reminders_one_active_occurrence_per_series
on public.reminders (series_id)
where completed_at is null and deleted_at is null;

alter table public.reminders enable row level security;
revoke all on table public.reminders from anon, authenticated;
grant select, insert, update on table public.reminders to authenticated;

create policy "reminders_select_own"
on public.reminders for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "reminders_insert_own"
on public.reminders for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "reminders_update_own"
on public.reminders for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create trigger reminders_set_updated_at
before update on public.reminders
for each row execute function public.set_profile_updated_at();

create function public.complete_reminder(
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
        due_local_date, local_time, timezone, repeat_rule, series_start_date, note
      ) values (
        current_reminder.series_id, current_reminder.owner_id,
        current_reminder.pet_id, gen_random_uuid(), current_reminder.category,
        current_reminder.title, p_next_due_date, current_reminder.local_time,
        current_reminder.timezone, current_reminder.repeat_rule,
        current_reminder.series_start_date, current_reminder.note
      ) returning id into created_next_id;
    end if;
  end if;

  return query select current_reminder.id, created_next_id;
end;
$$;

revoke all on function public.complete_reminder(uuid, date)
from public, anon;
grant execute on function public.complete_reminder(uuid, date)
to authenticated;

create function public.claim_due_reminders(
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
    where reminder.completed_at is null
      and reminder.deleted_at is null
      and reminder.notified_at is null
      and (
        reminder.due_local_date < (p_now at time zone reminder.timezone)::date
        or (
          reminder.due_local_date = (p_now at time zone reminder.timezone)::date
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
