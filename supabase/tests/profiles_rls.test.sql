begin;

select plan(18);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_user_meta_data,
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
    '{"display_name":"Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
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
    '{"display_name":"Other Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(),
    now(),
    now()
  );

select is((select count(*) from public.profiles), 2::bigint, 'profiles are created for auth users');
select is((select count(*) from public.policy_acceptances), 2::bigint, 'terms acceptances are recorded for auth users');
select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'Owner',
  'display name is copied into the private profile'
);

set local role anon;
select is((select count(*) from public.profiles), 0::bigint, 'anonymous users cannot read profiles');
select throws_ok(
  $$select * from public.policy_acceptances$$,
  '42501',
  null,
  'anonymous users cannot read policy acceptances'
);
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
  (select count(*) from public.policy_acceptances),
  1::bigint,
  'owner reads only their policy acceptance'
);
select is(
  (select policy_version from public.policy_acceptances),
  '2026-08-12',
  'recorded acceptance uses the current terms version'
);
select is(
  (select id from public.profiles),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'owner reads their own profile'
);
select lives_ok(
  $$update public.profiles set updated_at = '2026-01-01' where id = '10000000-0000-0000-0000-000000000001'$$,
  'owner can update their profile'
);
select throws_ok(
  $$insert into public.policy_acceptances (user_id, policy_type, policy_version) values ('10000000-0000-0000-0000-000000000001', 'terms_of_service', 'forged')$$,
  '42501',
  null,
  'users cannot forge policy acceptances'
);
select throws_ok(
  $$update public.policy_acceptances set policy_version = 'forged' where user_id = '10000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'users cannot alter policy acceptances'
);
select throws_ok(
  $$delete from public.policy_acceptances where user_id = '10000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'users cannot delete policy acceptances'
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
select throws_ok(
  $$
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
      email_confirmed_at, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      '30000000-0000-0000-0000-000000000003',
      'authenticated', 'authenticated', 'missing-terms@example.test',
      crypt('not-a-real-password', gen_salt('bf')),
      '{"display_name":"Missing Terms"}', now(), now(), now()
    )
  $$,
  'P0001',
  'Current Terms of Service must be accepted',
  'account creation fails without current terms acceptance'
);

select * from finish();
rollback;
