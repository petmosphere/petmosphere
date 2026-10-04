begin;

select plan(3);

select is(
  (select count(*) from cron.job
    where jobname = 'dispatch-health-log-reminders'
      and schedule = '*/5 * * * *'
      and active
      and command like '%/api/v1/health-log-reminders/dispatch%'),
  1::bigint,
  'daily check-in dispatcher runs every five minutes'
);

select is(
  (select count(*) from cron.job
    where jobname = 'dispatch-pet-care-reminders'
      and schedule = '*/5 * * * *'
      and active
      and command like '%/api/v1/reminders/dispatch%'),
  1::bigint,
  'pet-care dispatcher runs every five minutes'
);

select is(
  (select count(*) from cron.job
    where jobname = 'dispatch-pet-weight-reminders'
      and schedule = '*/5 * * * *'
      and active
      and command like '%/api/v1/weight-reminders/dispatch%'),
  1::bigint,
  'weight dispatcher runs every five minutes'
);

select * from finish();
rollback;
