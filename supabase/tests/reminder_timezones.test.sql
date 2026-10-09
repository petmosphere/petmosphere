begin;
select plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a1000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'perth-reminders@example.test',
  crypt('not-a-real-password', gen_salt('bf')),
  '{"display_name":"Perth Tester","terms_accepted":true,"terms_version":"2026-08-12"}',
  now(), now(), now()
);

insert into public.pets (id, owner_id, creation_request_id, name, species)
values (
  'a2000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000001',
  'a3000000-0000-4000-8000-000000000003', 'Cookie', 'dog'
);

insert into public.reminders (
  id, series_id, owner_id, pet_id, creation_request_id, category, title,
  due_local_date, local_time, timezone, repeat_rule, series_start_date,
  notification_lead_minutes
) values (
  'a4000000-0000-4000-8000-000000000004',
  'a4000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000002',
  'a5000000-0000-4000-8000-000000000005',
  'vet_visit', 'Annual checkup', '2026-10-10', '09:00',
  'Australia/Perth', 'never', '2026-10-10', 0
);

insert into public.health_log_reminders (
  owner_id, pet_id, enabled, local_time, timezone
) values (
  'a1000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000002',
  true, '09:00', 'Australia/Perth'
);

insert into public.pet_weight_reminders (
  owner_id, pet_id, enabled, frequency, schedule_day, local_time,
  timezone, next_due_local_date
) values (
  'a1000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000002',
  true, 'weekly', 6, '09:00', 'Australia/Perth', '2026-10-10'
);

select ok(public.is_valid_time_zone('Australia/Perth'), 'Perth is valid');
select ok(not public.is_valid_time_zone('Mars/Olympus'), 'unknown zones are rejected');

set local role service_role;
select is(
  (select count(*) from public.claim_due_reminders('2026-10-10T00:59:00Z', 100)),
  0::bigint, 'care reminder is not sent before 9am Perth time'
);
select is(
  (select count(*) from public.claim_due_reminders('2026-10-10T01:00:00Z', 100)),
  1::bigint, 'care reminder is sent at 9am Perth time'
);
select is(
  (select count(*) from public.claim_due_health_log_reminders('2026-10-10T00:59:00Z', 100)),
  0::bigint, 'daily check-in is not sent before 9am Perth time'
);
select is(
  (select count(*) from public.claim_due_health_log_reminders('2026-10-10T01:00:00Z', 100)),
  1::bigint, 'daily check-in is sent at 9am Perth time'
);
select is(
  (select count(*) from public.claim_due_pet_weight_reminders('2026-10-10T00:59:00Z', 100)),
  0::bigint, 'weight reminder is not sent before 9am Perth time'
);
select is(
  (select count(*) from public.claim_due_pet_weight_reminders('2026-10-10T01:00:00Z', 100)),
  1::bigint, 'weight reminder is sent at 9am Perth time'
);

select throws_ok(
  $$update public.reminders set timezone = 'Mars/Olympus'
    where id = 'a4000000-0000-4000-8000-000000000004'$$,
  '23514', null, 'invalid time zones cannot be stored directly'
);

select * from finish();
rollback;
