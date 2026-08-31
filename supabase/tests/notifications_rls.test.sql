begin;

select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000',
   '81000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'notification-owner@example.test', crypt('not-real', gen_salt('bf')),
   '{"display_name":"Owner","terms_accepted":true,"terms_version":"2026-08-12"}',
   now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '82000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'notification-other@example.test', crypt('not-real', gen_salt('bf')),
   '{"display_name":"Other","terms_accepted":true,"terms_version":"2026-08-12"}',
   now(), now(), now());

insert into public.notifications (
  id, owner_id, kind, title, message, dedupe_key
) values (
  '83000000-0000-4000-8000-000000000003',
  '81000000-0000-4000-8000-000000000001',
  'daily_check_in', 'Daily Check-in', 'Record today''s check-in.', 'test:one'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"81000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is((select count(*) from public.notifications), 1::bigint,
  'owner reads their notification');
select lives_ok(
  $$update public.notifications set read_at = now()
    where id = '83000000-0000-4000-8000-000000000003'$$,
  'owner marks their notification read'
);
select throws_ok(
  $$insert into public.notifications (owner_id, kind, title, message, dedupe_key)
    values ('81000000-0000-4000-8000-000000000001', 'daily_check_in',
    'Forged', 'Forged', 'forged')$$,
  '42501', null, 'owners cannot create system notifications'
);
select throws_ok(
  $$update public.notifications set title = 'Changed'$$,
  '42501', null, 'owners cannot alter notification content'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"82000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is((select count(*) from public.notifications), 0::bigint,
  'another owner cannot read notifications');
select results_eq(
  $$update public.notifications set read_at = now() returning id$$,
  $$select null::uuid where false$$,
  'another owner cannot mark notifications read'
);

reset role;
set local role anon;
select throws_ok($$select * from public.notifications$$, '42501', null,
  'anonymous users cannot read notifications');
select throws_ok($$update public.notifications set read_at = now()$$,
  '42501', null, 'anonymous users cannot update notifications');

select * from finish();
rollback;
