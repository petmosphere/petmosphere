begin;

select plan(18);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '40000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated', 'pet-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Pet Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated', 'other-pet-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Other Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}';

select lives_ok(
  $$insert into public.pets (
    id, owner_id, creation_request_id, name, species
  ) values (
    '60000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000004',
    '70000000-0000-0000-0000-000000000007',
    'Max', 'dog'
  )$$,
  'owner can create their pet'
);
select is((select count(*) from public.pets), 1::bigint, 'owner reads their pet');
select throws_ok(
  $$insert into public.pets (
    owner_id, creation_request_id, name, species
  ) values (
    '50000000-0000-0000-0000-000000000005',
    '80000000-0000-0000-0000-000000000008',
    'Not mine', 'cat'
  )$$,
  '42501', null, 'owner cannot create a pet for another user'
);
select lives_ok(
  $$update public.pets set name = 'Changed' where id = '60000000-0000-0000-0000-000000000006'$$,
  'owner can update their pet'
);
select is(
  (select name from public.pets where id = '60000000-0000-0000-0000-000000000006'),
  'Changed',
  'owner reads their updated pet'
);
select lives_ok(
  $$delete from public.pets where id = '60000000-0000-0000-0000-000000000006'$$,
  'owner deletes their pet'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
    'pet-photos',
    '40000000-0000-0000-0000-000000000004/60000000-0000-0000-0000-000000000006/profile.webp',
    '40000000-0000-0000-0000-000000000004'
  )$$,
  'owner can create an object in their photo folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
    'pet-photos',
    '50000000-0000-0000-0000-000000000005/foreign/profile.webp',
    '40000000-0000-0000-0000-000000000004'
  )$$,
  '42501', null, 'owner cannot create an object in another photo folder'
);

reset role;
insert into public.pets (
  owner_id, creation_request_id, name, species
) values (
  '50000000-0000-0000-0000-000000000005',
  '90000000-0000-0000-0000-000000000009',
  'Milo', 'cat'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*) from public.pets), 0::bigint, 'other owner pet is hidden');
select lives_ok(
  $$update public.pets set name = 'Changed by another owner' where owner_id = '50000000-0000-0000-0000-000000000005'$$,
  'updates cannot reach another owner pet'
);
select lives_ok(
  $$delete from public.pets where owner_id = '50000000-0000-0000-0000-000000000005'$$,
  'deletes cannot reach another owner pet'
);
reset role;
select is(
  (select name from public.pets where owner_id = '50000000-0000-0000-0000-000000000005'),
  'Milo',
  'another owner cannot change the pet'
);
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is(
  (select count(*) from storage.objects where bucket_id = 'pet-photos'),
  1::bigint,
  'other owner storage objects are hidden'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.pets$$,
  '42501', null, 'anonymous user cannot read pets'
);
select throws_ok(
  $$insert into public.pets (
    owner_id, creation_request_id, name, species
  ) values (
    '40000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-00000000000a',
    'Anonymous', 'other'
  )$$,
  '42501', null, 'anonymous user cannot create pets'
);
select throws_ok(
  $$update public.pets set name = 'Anonymous change' where id = '60000000-0000-0000-0000-000000000006'$$,
  '42501', null, 'anonymous user cannot update pets'
);
select throws_ok(
  $$delete from public.pets where id = '60000000-0000-0000-0000-000000000006'$$,
  '42501', null, 'anonymous user cannot delete pets'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'pet-photos'),
  0::bigint,
  'anonymous user reads no pet photos'
);

select * from finish();
rollback;
