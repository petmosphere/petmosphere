create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  creation_request_id uuid not null,
  name text not null check (
    name = btrim(name) and char_length(name) between 1 and 80
  ),
  species text not null check (species in ('dog', 'cat', 'other')),
  breed text check (breed is null or char_length(breed) between 1 and 100),
  birth_date date check (
    birth_date is null
    or birth_date <= (current_timestamp at time zone 'Australia/Melbourne')::date
  ),
  approximate_age text check (
    approximate_age is null or approximate_age in ('baby', 'young', 'adult', 'senior')
  ),
  sex text check (sex is null or sex in ('male', 'female', 'unknown')),
  weight_kg numeric(6, 2) check (
    weight_kg is null or weight_kg > 0 and weight_kg <= 300
  ),
  desexed_status text check (
    desexed_status is null or desexed_status in ('yes', 'no', 'unknown')
  ),
  photo_path text check (
    photo_path is null or split_part(photo_path, '/', 1) = owner_id::text
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_one_age_source check (
    birth_date is null or approximate_age is null
  ),
  unique (owner_id, creation_request_id)
);

comment on table public.pets is 'Private pet profiles owned by one authenticated user.';
comment on column public.pets.creation_request_id is
  'Client request identifier used to make pet creation retry-safe.';

create index pets_owner_created_at_idx
on public.pets (owner_id, created_at);

alter table public.pets enable row level security;

revoke all on table public.pets from anon, authenticated;
grant select, insert on table public.pets to authenticated;

create policy "pets_select_own"
on public.pets
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "pets_insert_own"
on public.pets
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create trigger pets_set_updated_at
before update on public.pets
for each row execute function public.set_profile_updated_at();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'pet-photos',
  'pet-photos',
  false,
  4194304,
  array['image/webp']
)
on conflict (id) do nothing;

create policy "pet_photos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "pet_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "pet_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
