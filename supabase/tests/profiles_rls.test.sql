begin;

select plan(9);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    now(),
    now(),
    now()
  );

select is((select count(*) from public.profiles), 2::bigint, 'profiles are created for auth users');

set local role anon;
select is((select count(*) from public.profiles), 0::bigint, 'anonymous users cannot read profiles');
select throws_ok(
  $$insert into public.profiles (id) values ('30000000-0000-0000-0000-000000000003')$$,
  '42501',
  null,
  'anonymous users cannot insert profiles'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*) from public.profiles), 1::bigint, 'owner reads only their profile');
select is(
  (select id from public.profiles),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'owner reads their own profile'
);
select lives_ok(
  $$update public.profiles set updated_at = '2026-01-01' where id = '10000000-0000-0000-0000-000000000001'$$,
  'owner can update their profile'
);
select is(
  (
    select count(*)
    from public.profiles
    where id = '20000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'owner cannot read another profile'
);
select lives_ok(
  $$update public.profiles set updated_at = '2026-01-01' where id = '20000000-0000-0000-0000-000000000002'$$,
  'updating another profile is safely ignored'
);

reset role;
select isnt(
  (select updated_at::date from public.profiles where id = '20000000-0000-0000-0000-000000000002'),
  '2026-01-01'::date,
  'owner cannot update another profile'
);

select * from finish();
rollback;
