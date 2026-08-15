alter table public.pets
add constraint pets_id_owner_unique unique (id, owner_id);

create table public.health_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null,
  creation_request_id uuid not null,
  local_date date not null,
  derivation_timezone text not null check (
    char_length(derivation_timezone) between 1 and 100
  ),
  status text not null check (
    status in ('doing_well', 'something_different', 'concerned')
  ),
  note text check (note is null or char_length(note) between 1 and 4000),
  image_paths text[] not null default '{}',
  source text not null default 'web' check (source = 'web'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_logs_pet_membership foreign key (pet_id, owner_id)
    references public.pets (id, owner_id) on delete cascade,
  constraint health_logs_image_limit check (cardinality(image_paths) <= 4),
  constraint health_logs_image_paths_not_null check (
    array_position(image_paths, null) is null
  ),
  unique (pet_id, local_date),
  unique (owner_id, creation_request_id)
);

comment on table public.health_logs is
  'Private daily owner observations. One record per pet and local calendar date.';
comment on column public.health_logs.derivation_timezone is
  'IANA timezone used to derive local_date from the UTC save timestamp.';
comment on column public.health_logs.status is
  'Non-diagnostic owner-selected wellbeing observation.';

create index health_logs_owner_created_at_idx
on public.health_logs (owner_id, created_at desc);

alter table public.health_logs enable row level security;

revoke all on table public.health_logs from anon, authenticated;
grant select, insert, update on table public.health_logs to authenticated;

create policy "health_logs_select_own"
on public.health_logs
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "health_logs_insert_own"
on public.health_logs
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "health_logs_update_own"
on public.health_logs
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create trigger health_logs_set_updated_at
before update on public.health_logs
for each row execute function public.set_profile_updated_at();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'health-log-images',
  'health-log-images',
  false,
  4194304,
  array['image/webp']
)
on conflict (id) do nothing;

create policy "health_log_images_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'health-log-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "health_log_images_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'health-log-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "health_log_images_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'health-log-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create table public.health_log_analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null check (
    event_name in (
      'health_log_started',
      'health_log_completed',
      'health_log_save_failed'
    )
  ),
  image_count smallint check (image_count between 0 and 4),
  optional_field_count smallint check (optional_field_count between 0 and 2),
  time_to_complete_ms integer check (
    time_to_complete_ms between 0 and 86400000
  ),
  created_at timestamptz not null default now()
);

comment on table public.health_log_analytics_events is
  'Privacy-minimised Journey A events. Contains no user, pet, note, filename, media, or request identifiers. Retained for at most 90 days.';

alter table public.health_log_analytics_events enable row level security;
revoke all on table public.health_log_analytics_events from anon, authenticated;
grant insert on table public.health_log_analytics_events to authenticated;

create policy "health_log_analytics_insert_authenticated"
on public.health_log_analytics_events
for insert
to authenticated
with check (true);

create function public.prune_health_log_analytics_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.health_log_analytics_events
  where created_at < now() - interval '90 days';
  return new;
end;
$$;

revoke all on function public.prune_health_log_analytics_events() from public;

create trigger health_log_analytics_prune
after insert on public.health_log_analytics_events
for each statement execute function public.prune_health_log_analytics_events();
