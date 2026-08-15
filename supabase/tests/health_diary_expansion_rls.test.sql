begin;

select plan(12);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'diary-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Diary Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a2000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'diary-other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Diary Other","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

insert into public.pets (id, owner_id, creation_request_id, name, species)
values
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001', 'Max', 'dog'
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000002', 'Milo', 'cat'
  );

insert into public.health_logs (
  id, owner_id, pet_id, creation_request_id, local_date,
  derivation_timezone, status
) values (
  'd1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  '2026-08-15', 'Australia/Melbourne', 'doing_well'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$update public.health_logs
    set observations = array['ate_less', 'low_energy'],
        status = 'something_different',
        local_date = '2026-08-14'
    where id = 'd1000000-0000-0000-0000-000000000001'$$,
  'owner updates date, emotion and matching observations'
);

select throws_ok(
  $$update public.health_logs
    set observations = array['vomited'], status = 'doing_well'
    where id = 'd1000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'observation must match the selected emotion'
);

select lives_ok(
  $$insert into public.health_log_reminders (
    owner_id, pet_id, enabled, local_time, timezone
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    true, '19:30', 'Australia/Melbourne'
  )$$,
  'owner creates a reminder preference for their pet'
);

select is(
  (select count(*) from public.health_log_reminders),
  1::bigint,
  'owner reads their reminder preference'
);

select throws_ok(
  $$insert into public.health_log_reminders (
    owner_id, pet_id, enabled, local_time, timezone
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    true, '19:30', 'Australia/Melbourne'
  )$$,
  '23503', null, 'owner cannot create a reminder for another owner pet'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"a2000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*) from public.health_log_reminders),
  0::bigint,
  'another owner reminder is hidden'
);

select results_eq(
  $$update public.health_log_reminders set enabled = false
    where owner_id = 'a1000000-0000-0000-0000-000000000001'
    returning pet_id$$,
  $$select null::uuid where false$$,
  'another owner cannot update the reminder'
);

select results_eq(
  $$delete from public.health_log_reminders
    where owner_id = 'a1000000-0000-0000-0000-000000000001'
    returning pet_id$$,
  $$select null::uuid where false$$,
  'another owner cannot delete the reminder'
);

select results_eq(
  $$delete from public.health_logs
    where owner_id = 'a1000000-0000-0000-0000-000000000001'
    returning id$$,
  $$select null::uuid where false$$,
  'another owner cannot delete a health log'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.health_log_reminders$$,
  '42501', null, 'anonymous user cannot read reminder preferences'
);

select throws_ok(
  $$insert into public.health_log_reminders (
    owner_id, pet_id, enabled, local_time, timezone
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    true, '19:30', 'Australia/Melbourne'
  )$$,
  '42501', null, 'anonymous user cannot create reminder preferences'
);

select throws_ok(
  $$delete from public.health_logs$$,
  '42501', null, 'anonymous user cannot delete health logs'
);

select * from finish();
rollback;
