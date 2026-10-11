alter table public.profiles
  add column preferred_timezone text,
  add constraint profiles_preferred_timezone_check
    check (preferred_timezone is null or public.is_valid_time_zone(preferred_timezone));

comment on column public.profiles.preferred_timezone is
  'Optional account default for new schedules and local-date views; existing schedules keep their own timezone.';
