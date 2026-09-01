alter table public.profiles
add column is_subscribed boolean not null default false;

comment on column public.profiles.is_subscribed is
  'Mocked subscription entitlement flag; raises the owned-pet limit from 1 to 3. No real billing yet.';
