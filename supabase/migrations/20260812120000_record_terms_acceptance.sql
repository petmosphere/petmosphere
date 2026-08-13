alter table public.profiles
add column display_name text
check (display_name is null or char_length(display_name) between 1 and 100);

create table public.policy_acceptances (
  user_id uuid not null references auth.users (id) on delete cascade,
  policy_type text not null check (policy_type in ('terms_of_service')),
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, policy_type, policy_version)
);

comment on table public.policy_acceptances is
  'Append-only evidence of the policy version accepted by a user.';

alter table public.policy_acceptances enable row level security;

revoke all on table public.policy_acceptances from anon, authenticated;
grant select on table public.policy_acceptances to authenticated;

create policy "policy_acceptances_select_own"
on public.policy_acceptances
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_terms boolean := coalesce(
    (new.raw_user_meta_data ->> 'terms_accepted')::boolean,
    false
  );
  accepted_version text := new.raw_user_meta_data ->> 'terms_version';
  supplied_name text := btrim(new.raw_user_meta_data ->> 'display_name');
begin
  if not accepted_terms or accepted_version is distinct from '2026-08-12' then
    raise exception 'Current Terms of Service must be accepted';
  end if;

  if supplied_name is null or char_length(supplied_name) not between 1 and 100 then
    raise exception 'A valid display name is required';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, supplied_name)
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.policy_acceptances (
    user_id,
    policy_type,
    policy_version
  ) values (
    new.id,
    'terms_of_service',
    accepted_version
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public;
