begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '85000000-0000-4000-8000-000000000005',
  'authenticated', 'authenticated', 'weight-schedule@example.test',
  crypt('not-a-real-password', gen_salt('bf')),
  '{"display_name":"Weight Schedule","terms_accepted":true,"terms_version":"2026-08-12"}',
  now(), now(), now()
);

insert into public.pets (id, owner_id, creation_request_id, name, species)
values (
  '86000000-0000-4000-8000-000000000006',
  '85000000-0000-4000-8000-000000000005',
  '87000000-0000-4000-8000-000000000007',
  'Max', 'dog'
);

insert into public.web_push_subscriptions (owner_id, endpoint, p256dh, auth)
values (
  '85000000-0000-4000-8000-000000000005',
  'https://push.example.test/weight-schedule',
  'test-p256dh', 'test-auth'
);

insert into public.pet_weight_reminders (
  owner_id, pet_id, enabled, frequency, schedule_day, local_time,
  next_due_local_date
) values (
  '85000000-0000-4000-8000-000000000005',
  '86000000-0000-4000-8000-000000000006',
  true, 'weekly', 0, '20:00', date '2026-01-04'
);

set local role service_role;
select is(
  (select count(*) from public.claim_due_pet_weight_reminders('2026-08-25T12:00:00Z', 100)),
  1::bigint,
  'a stale due reminder is claimed once'
);
reset role;
select is(
  (select next_due_local_date from public.pet_weight_reminders),
  date '2026-08-30',
  'a stale weekly reminder advances directly to the next future occurrence'
);
set local role service_role;
select is(
  (select count(*) from public.claim_due_pet_weight_reminders('2026-08-25T12:05:00Z', 100)),
  0::bigint,
  'a second job run does not duplicate the reminder'
);

reset role;
update public.pet_weight_reminders
set frequency = 'monthly', schedule_day = 31, next_due_local_date = date '2026-01-31';
set local role service_role;
select is(
  (select count(*) from public.claim_due_pet_weight_reminders('2026-08-31T12:00:00Z', 100)),
  1::bigint,
  'month-end reminders remain claimable after catch-up'
);

select * from finish();
rollback;
