begin;

select plan(3);

select is(
  (select count(*) from cron.job
    where jobname = 'dispatch-health-log-reminders'
      and schedule = '* * * * *'
      and active
      and command like '%timeout_milliseconds := 30000%'
      and command like '%/api/v1/health-log-reminders/dispatch%'),
  1::bigint,
  'daily check-in dispatcher runs every minute'
);

select is(
  (select count(*) from cron.job
    where jobname = 'dispatch-pet-care-reminders'
      and schedule = '* * * * *'
      and active
      and command like '%timeout_milliseconds := 30000%'
      and command like '%/api/v1/reminders/dispatch%'),
  1::bigint,
  'pet-care dispatcher runs every minute'
);

select is(
  (select count(*) from cron.job
    where jobname = 'dispatch-pet-weight-reminders'
      and schedule = '* * * * *'
      and active
      and command like '%timeout_milliseconds := 30000%'
      and command like '%/api/v1/weight-reminders/dispatch%'),
  1::bigint,
  'weight dispatcher runs every minute'
);

select * from finish();
rollback;
