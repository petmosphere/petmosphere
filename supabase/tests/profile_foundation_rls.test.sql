begin;

select plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'profile-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Profile Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '92000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'profile-other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Profile Other","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';

select lives_ok(
  $$update public.profiles
    set display_name = 'Updated Owner', weight_unit = 'lb',
        avatar_path = '91000000-0000-4000-8000-000000000001/avatar.webp',
        reminder_notifications_enabled = false,
        reminder_alert_lead_days = 2
    where id = '91000000-0000-4000-8000-000000000001'$$,
  'owner updates their profile and preferences'
);
select is(
  (select weight_unit from public.profiles),
  'lb',
  'owner reads their saved weight unit'
);
select throws_ok(
  $$update public.profiles set weight_unit = 'stone'$$,
  '23514', null, 'invalid units are rejected'
);
select is(
  (select reminder_alert_lead_days from public.profiles),
  2::smallint,
  'owner reads their saved reminder alert timing'
);
select throws_ok(
  $$update public.profiles set reminder_alert_lead_days = 4$$,
  '23514', null, 'unsupported reminder alert timing is rejected'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
    'profile-avatars',
    '91000000-0000-4000-8000-000000000001/avatar.webp',
    '91000000-0000-4000-8000-000000000001'
  )$$,
  'owner creates an avatar in their private folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
    'profile-avatars',
    '92000000-0000-4000-8000-000000000002/foreign.webp',
    '91000000-0000-4000-8000-000000000001'
  )$$,
  '42501', null, 'owner cannot create an avatar in another owner folder'
);
reset role;
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}';

select results_eq(
  $$update public.profiles set display_name = 'Changed by other owner'
    where id = '91000000-0000-4000-8000-000000000001' returning id$$,
  $$select null::uuid where false$$,
  'another owner cannot update the profile'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'profile-avatars'),
  0::bigint,
  'another owner cannot read the avatar'
);

select * from finish();
rollback;
