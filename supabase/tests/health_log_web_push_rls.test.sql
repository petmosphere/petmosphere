begin;

select plan(18);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'f1000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'push-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Push Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f2000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'push-other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Push Other","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

insert into public.pets (id, owner_id, creation_request_id, name, species)
values
  (
    'f3000000-0000-0000-0000-000000000003',
    'f1000000-0000-0000-0000-000000000001',
    'f4000000-0000-0000-0000-000000000004', 'Max', 'dog'
  ),
  (
    'f5000000-0000-0000-0000-000000000005',
    'f2000000-0000-0000-0000-000000000002',
    'f6000000-0000-0000-0000-000000000006', 'Milo', 'cat'
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$select public.save_web_push_subscription(
    'https://push.example.test/shared', 'owner-key', 'owner-auth'
  )$$,
  'owner saves a browser push subscription'
);

select is(
  (select count(*) from public.web_push_subscriptions
    where owner_id in (
      'f1000000-0000-0000-0000-000000000001',
      'f2000000-0000-0000-0000-000000000002'
    )),
  1::bigint,
  'owner reads their push subscription'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"f2000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*) from public.web_push_subscriptions),
  0::bigint,
  'another owner cannot read the subscription'
);

select results_eq(
  $$delete from public.web_push_subscriptions returning id$$,
  $$select null::uuid where false$$,
  'another owner cannot delete the subscription'
);

select lives_ok(
  $$select public.save_web_push_subscription(
    'https://push.example.test/shared', 'other-key', 'other-auth'
  )$$,
  'the same browser endpoint can be reassigned after account switching'
);

select is(
  (select count(*) from public.web_push_subscriptions),
  1::bigint,
  'the new owner reads the reassigned subscription'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from public.web_push_subscriptions),
  0::bigint,
  'the former owner can no longer read the reassigned subscription'
);

select lives_ok(
  $$select public.save_web_push_subscription(
    'https://push.example.test/owner', 'owner-key-2', 'owner-auth-2'
  )$$,
  'the owner saves another browser subscription'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.web_push_subscriptions$$,
  '42501', null, 'anonymous users cannot read push subscriptions'
);

select throws_ok(
  $$select public.save_web_push_subscription(
    'https://push.example.test/anonymous', 'key', 'auth'
  )$$,
  '42501', null, 'anonymous users cannot save push subscriptions'
);

reset role;

insert into public.health_log_reminders (
  owner_id, pet_id, enabled, local_time, timezone
) values
  (
    'f1000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000003',
    true, '19:00', 'Australia/Melbourne'
  ),
  (
    'f2000000-0000-0000-0000-000000000002',
    'f5000000-0000-0000-0000-000000000005',
    true, '19:00', 'Australia/Melbourne'
  );

insert into public.health_logs (
  owner_id, pet_id, creation_request_id, local_date,
  derivation_timezone, status
) values (
  'f2000000-0000-0000-0000-000000000002',
  'f5000000-0000-0000-0000-000000000005',
  'f7000000-0000-0000-0000-000000000007',
  '2026-01-15', 'Australia/Melbourne', 'doing_well'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok(
  $$update public.health_log_reminders
    set timezone = 'Invalid/Timezone'
    where owner_id = 'f1000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'invalid timezones cannot break reminder dispatch'
);

reset role;

set local role service_role;

select is(
  (select count(*) from public.web_push_subscriptions
    where owner_id in (
      'f1000000-0000-0000-0000-000000000001',
      'f2000000-0000-0000-0000-000000000002'
    )),
  2::bigint,
  'the server delivery role can read subscriptions after RLS checks'
);

select results_eq(
  $$select owner_id, pet_id, local_date
    from public.claim_due_health_log_reminders(
      '2026-01-15 08:00:00+00', 100
    )$$,
  $$values (
    'f1000000-0000-0000-0000-000000000001'::uuid,
    'f3000000-0000-0000-0000-000000000003'::uuid,
    '2026-01-15'::date
  )$$,
  '7 pm AEDT is due and an existing local-date health log is skipped'
);

select is(
  (select count(*) from public.notifications
    where owner_id = 'f1000000-0000-0000-0000-000000000001'
      and kind = 'daily_check_in'),
  1::bigint,
  'claiming a daily check-in creates one in-app notification'
);

reset role;

select is(
  (
    select last_notified_local_date
    from public.health_log_reminders
    where owner_id = 'f2000000-0000-0000-0000-000000000002'
  ),
  null::date,
  'a skipped reminder is not marked as notified'
);

set local role service_role;

select is_empty(
  $$select * from public.claim_due_health_log_reminders(
    '2026-01-15 08:01:00+00', 100
  )$$,
  'a second dispatcher cannot claim the same pet and date'
);

reset role;

update public.health_log_reminders
set enabled = false
where owner_id = 'f2000000-0000-0000-0000-000000000002';

set local role service_role;

select is_empty(
  $$select * from public.claim_due_health_log_reminders(
    '2026-07-15 08:59:00+00', 100
  )$$,
  '6:59 pm AEST is not due'
);

select results_eq(
  $$select owner_id, pet_id, local_date
    from public.claim_due_health_log_reminders(
      '2026-07-15 09:00:00+00', 100
    )$$,
  $$values (
    'f1000000-0000-0000-0000-000000000001'::uuid,
    'f3000000-0000-0000-0000-000000000003'::uuid,
    '2026-07-15'::date
  )$$,
  '7 pm AEST is due after daylight saving ends'
);

select * from finish();
rollback;
