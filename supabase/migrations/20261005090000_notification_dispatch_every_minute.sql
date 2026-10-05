-- Preserve the protected job commands and environment-specific Vault values.
-- Minute-resolution reminders need minute-resolution dispatch, including when
-- the installed PWA is closed. Named jobs were created by the prior migration.
select cron.alter_job(
  jobid,
  schedule := '* * * * *',
  command := replace(command, 'timeout_milliseconds := 10000', 'timeout_milliseconds := 30000')
)
from cron.job
where jobname in (
  'dispatch-health-log-reminders',
  'dispatch-pet-care-reminders',
  'dispatch-pet-weight-reminders'
);
