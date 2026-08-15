begin;

select plan(20);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'health-owner@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Health Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a2000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'health-other@example.test',
    crypt('not-a-real-password', gen_salt('bf')),
    '{"display_name":"Health Other","terms_accepted":true,"terms_version":"2026-08-12"}',
    now(), now(), now()
  );

insert into public.pets (id, owner_id, creation_request_id, name, species)
values
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Max', 'dog'
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000002',
    'Milo', 'cat'
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$insert into public.health_logs (
    id, owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status, source
  ) values (
    'd1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    '2026-08-15', 'Australia/Melbourne', 'doing_well', 'web'
  )$$,
  'owner creates a health log for their pet'
);
select is(
  (select count(*) from public.health_logs),
  1::bigint,
  'owner reads their health log'
);
select throws_ok(
  $$insert into public.health_logs (
    owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e2000000-0000-0000-0000-000000000002',
    '2026-08-15', 'Australia/Melbourne', 'concerned'
  )$$,
  '23505', null, 'only one health log can exist per pet and local date'
);
select throws_ok(
  $$insert into public.health_logs (
    owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    '2026-08-16', 'Australia/Melbourne', 'doing_well'
  )$$,
  '23505', null, 'an idempotency key cannot create a second health log'
);
select throws_ok(
  $$insert into public.health_logs (
    owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e3000000-0000-0000-0000-000000000003',
    '2026-08-16', 'Australia/Melbourne', 'diagnosed_safe'
  )$$,
  '23514', null, 'diagnostic status values are rejected'
);
select throws_ok(
  $$insert into public.health_logs (
    owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status, note
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e4000000-0000-0000-0000-000000000004',
    '2026-08-16', 'Australia/Melbourne', 'doing_well', repeat('x', 4001)
  )$$,
  '23514', null, 'oversized notes are rejected'
);
select throws_ok(
  $$insert into public.health_logs (
    owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    'e5000000-0000-0000-0000-000000000005',
    '2026-08-16', 'Australia/Melbourne', 'doing_well'
  )$$,
  '23503', null, 'owner cannot attach a health log to another owner pet'
);
select lives_ok(
  $$update public.health_logs
    set status = 'something_different'
    where id = 'd1000000-0000-0000-0000-000000000001'$$,
  'owner updates their health log'
);
select lives_ok(
  $$do $body$
    begin
      insert into public.health_logs (
        id, owner_id, pet_id, creation_request_id, local_date,
        derivation_timezone, status
      ) values (
        'd1000000-0000-0000-0000-000000000009',
        'a1000000-0000-0000-0000-000000000001',
        'b1000000-0000-0000-0000-000000000001',
        'e1000000-0000-0000-0000-000000000009',
        '2026-08-18', 'Australia/Melbourne', 'doing_well'
      );
      delete from public.health_logs
      where id = 'd1000000-0000-0000-0000-000000000009';
    end
    $body$;$$,
  'owner deletes their health log'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
    'health-log-images',
    'a1000000-0000-0000-0000-000000000001/b1000000-0000-0000-0000-000000000001/d1000000-0000-0000-0000-000000000001/photo.webp',
    'a1000000-0000-0000-0000-000000000001'
  )$$,
  'owner creates an image in their private folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values (
    'health-log-images',
    'a2000000-0000-0000-0000-000000000002/foreign/photo.webp',
    'a1000000-0000-0000-0000-000000000001'
  )$$,
  '42501', null, 'owner cannot create an image in another owner folder'
);
select lives_ok(
  $$insert into public.health_log_analytics_events (
    event_name, image_count, optional_field_count, time_to_complete_ms
  ) values ('health_log_completed', 2, 2, 12000)$$,
  'authenticated user records privacy-minimised analytics'
);
select throws_ok(
  $$select * from public.health_log_analytics_events$$,
  '42501', null, 'analytics events are not readable by application users'
);

reset role;
insert into public.health_logs (
  owner_id, pet_id, creation_request_id, local_date,
  derivation_timezone, status
) values (
  'a2000000-0000-0000-0000-000000000002',
  'b2000000-0000-0000-0000-000000000002',
  'e6000000-0000-0000-0000-000000000006',
  '2026-08-15', 'Australia/Melbourne', 'concerned'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(
  (select count(*) from public.health_logs),
  1::bigint,
  'another owner health log is hidden'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'health-log-images'),
  1::bigint,
  'another owner health images are hidden'
);
select is(
  (select count(*) from public.health_logs where owner_id =
    'a2000000-0000-0000-0000-000000000002'),
  0::bigint,
  'owner cannot query another owner health log directly'
);
select results_eq(
  $$update public.health_logs
    set status = 'doing_well'
    where owner_id = 'a2000000-0000-0000-0000-000000000002'
    returning id$$,
  $$select null::uuid where false$$,
  'owner cannot update another owner health log'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.health_logs$$,
  '42501', null, 'anonymous user cannot read health logs'
);
select throws_ok(
  $$insert into public.health_logs (
    owner_id, pet_id, creation_request_id, local_date,
    derivation_timezone, status
  ) values (
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e7000000-0000-0000-0000-000000000007',
    '2026-08-17', 'Australia/Melbourne', 'doing_well'
  )$$,
  '42501', null, 'anonymous user cannot create health logs'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'health-log-images'),
  0::bigint,
  'anonymous user reads no health images'
);

select * from finish();
rollback;
