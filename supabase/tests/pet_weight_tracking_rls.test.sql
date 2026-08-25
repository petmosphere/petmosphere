begin;
select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '81000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'weight-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Weight Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-8000-000000000000',
    '82000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'weight-other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Weight Other","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

insert into public.pets (id, owner_id, creation_request_id, name, species)
values (
  '83000000-0000-4000-8000-000000000003',
  '81000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000004',
  'Max', 'dog'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"81000000-0000-4000-8000-000000000001","role":"authenticated"}';

select lives_ok(
  $$insert into public.pet_weight_entries (owner_id, pet_id, local_date, weight_kg)
    values ('81000000-0000-4000-8000-000000000001', '83000000-0000-4000-8000-000000000003', date '2026-08-25', 8.60)$$,
  'owner creates their weight entry'
);
select is(
  (select weight_kg::numeric from public.pets where id = '83000000-0000-4000-8000-000000000003'),
  8.60::numeric,
  'weight entry updates the pet snapshot'
);
select throws_ok(
  $$insert into public.pet_weight_entries (owner_id, pet_id, local_date, weight_kg)
    values ('81000000-0000-4000-8000-000000000001', '83000000-0000-4000-8000-000000000003', date '2026-08-25', 9.0)$$,
  '23505', null, 'one weight entry per pet and local date'
);
select lives_ok(
  $$insert into public.pet_weight_reminders (owner_id, pet_id, enabled, frequency, schedule_day, next_due_local_date)
    values ('81000000-0000-4000-8000-000000000001', '83000000-0000-4000-8000-000000000003', true, 'weekly', 0, date '2026-08-30')$$,
  'owner creates their weight reminder'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"82000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is((select count(*) from public.pet_weight_entries), 0::bigint, 'another owner cannot read weight entries');
select is((select count(*) from public.pet_weight_reminders), 0::bigint, 'another owner cannot read weight reminders');
select throws_ok(
  $$insert into public.pet_weight_entries (owner_id, pet_id, local_date, weight_kg)
    values ('81000000-0000-4000-8000-000000000001', '83000000-0000-4000-8000-000000000003', date '2026-08-26', 9.0)$$,
  '42501', null, 'another owner cannot insert a weight entry for the owner'
);

reset role;
set local role anon;
select throws_ok($$select * from public.pet_weight_entries$$, '42501', null, 'anonymous users cannot read weight entries');

select * from finish();
rollback;
