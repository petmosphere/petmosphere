alter table public.profiles
add column avatar_path text check (
  avatar_path is null or split_part(avatar_path, '/', 1) = id::text
),
add column weight_unit text not null default 'kg' check (
  weight_unit in ('kg', 'lb')
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'profile-avatars',
  'profile-avatars',
  false,
  4194304,
  array['image/webp']
)
on conflict (id) do nothing;

create policy "profile_avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
