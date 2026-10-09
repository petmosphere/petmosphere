-- Preserve existing Melbourne schedules; new and edited schedules may use the
-- device's IANA time zone so wall-clock reminder times work outside Melbourne.
create or replace function public.is_valid_time_zone(p_name text)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_timezone_names
    where name = p_name and char_length(p_name) between 1 and 100
  );
$$;

alter table public.reminders
  drop constraint reminders_timezone_check,
  add constraint reminders_timezone_check
    check (public.is_valid_time_zone(timezone));

alter table public.health_log_reminders
  drop constraint health_log_reminders_timezone_melbourne,
  drop constraint health_log_reminders_timezone_check,
  add constraint health_log_reminders_timezone_check
    check (public.is_valid_time_zone(timezone));

alter table public.pet_weight_reminders
  drop constraint pet_weight_reminders_timezone_check,
  add constraint pet_weight_reminders_timezone_check
    check (public.is_valid_time_zone(timezone));

alter table public.pet_weight_entries
  drop constraint pet_weight_entries_derivation_timezone_check,
  add constraint pet_weight_entries_derivation_timezone_check
    check (public.is_valid_time_zone(derivation_timezone));

comment on column public.pet_weight_entries.derivation_timezone is
  'IANA time zone used to derive the weight entry local date.';
