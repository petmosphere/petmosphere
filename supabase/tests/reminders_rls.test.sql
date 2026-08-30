begin;

select plan(18);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'reminder-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Reminder Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'reminder-other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Reminder Other","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

insert into public.pets (id, owner_id, creation_request_id, name, species)
values
  ('73000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000001', '74000000-0000-4000-8000-000000000004', 'Max', 'dog'),
  ('75000000-0000-4000-8000-000000000005', '72000000-0000-4000-8000-000000000002', '76000000-0000-4000-8000-000000000006', 'Milo', 'cat');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"71000000-0000-4000-8000-000000000001","role":"authenticated"}';

select lives_ok(
  $$insert into public.reminders (
    id, series_id, owner_id, pet_id, creation_request_id, category, title,
    due_local_date, local_time, repeat_rule, series_start_date
  ) values (
    '77000000-0000-4000-8000-000000000007',
    '77000000-0000-4000-8000-000000000007',
    '71000000-0000-4000-8000-000000000001',
    '73000000-0000-4000-8000-000000000003',
    '78000000-0000-4000-8000-000000000008',
    'medication', 'Flea treatment', '2026-08-22', '19:00', 'monthly', '2026-08-22'
  )$$,
  'owner creates their reminder'
);

select is((select count(*) from public.reminders), 1::bigint, 'owner reads their reminder');
select is((select title from public.reminders limit 1), 'Flea treatment', 'stored title is available to owner');

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is((select count(*) from public.reminders), 0::bigint, 'another owner cannot read the reminder');
select results_eq(
  $$update public.reminders set title = 'Changed' returning id$$,
  $$select null::uuid where false$$,
  'another owner cannot update the reminder'
);
select throws_ok(
  $$insert into public.reminders (
    series_id, owner_id, pet_id, creation_request_id, category, title,
    due_local_date, local_time, repeat_rule, series_start_date
  ) values (
    gen_random_uuid(), '71000000-0000-4000-8000-000000000001',
    '73000000-0000-4000-8000-000000000003', gen_random_uuid(),
    'other', 'Not mine', '2026-08-23', '19:00', 'never', '2026-08-23'
  )$$,
  '42501', null, 'another owner cannot insert a reminder for the owner'
);
select is((select count(*) from public.complete_reminder('77000000-0000-4000-8000-000000000007', '2026-09-22')), 0::bigint, 'another owner cannot complete the reminder');

reset role;
set local role anon;
select throws_ok($$select * from public.reminders$$, '42501', null, 'anonymous users cannot read reminders');
select throws_ok($$select * from public.complete_reminder('77000000-0000-4000-8000-000000000007', null)$$, '42501', null, 'anonymous users cannot complete reminders');

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"71000000-0000-4000-8000-000000000001","role":"authenticated"}';

select lives_ok($$select * from public.complete_reminder('77000000-0000-4000-8000-000000000007', '2026-09-22')$$, 'owner completes a recurring reminder');
select is((select count(*) from public.reminders where completed_at is not null), 1::bigint, 'completion preserves one history row');
select is((select count(*) from public.reminders where completed_at is null and deleted_at is null), 1::bigint, 'completion creates one active future occurrence');
select lives_ok($$select * from public.complete_reminder('77000000-0000-4000-8000-000000000007', '2026-09-22')$$, 'completion retry is idempotent');
select is((select count(*) from public.reminders), 2::bigint, 'completion retry does not duplicate the next occurrence');
select is(
  (select count(*) from public.notifications
    where owner_id = '71000000-0000-4000-8000-000000000001'
      and kind = 'reminder_completed'),
  1::bigint,
  'completion creates one idempotent in-app notification'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"71000000-0000-4000-8000-000000000001","role":"authenticated"}';
update public.reminders
set notification_lead_minutes = 5
where owner_id = '71000000-0000-4000-8000-000000000001'
  and completed_at is null;
reset role;
set local role service_role;
select is(
  (select count(*) from public.claim_due_reminders('2026-09-22 08:54:00+00', 100)
    where owner_id = '71000000-0000-4000-8000-000000000001'),
  0::bigint,
  'lead-time reminder is not claimed before its alert window'
);
select is(
  (select count(*) from public.claim_due_reminders('2026-09-22 08:55:00+00', 100)
    where owner_id = '71000000-0000-4000-8000-000000000001'),
  1::bigint,
  'claiming at the lead time creates an inbox occurrence'
);

reset role;
set local role authenticated;
select throws_ok($$select * from public.claim_due_reminders(now(), 100)$$, '42501', null, 'authenticated clients cannot claim notifications');

select * from finish();
rollback;
