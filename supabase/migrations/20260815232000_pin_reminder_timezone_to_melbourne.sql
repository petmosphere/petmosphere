update public.health_log_reminders
set timezone = 'Australia/Melbourne'
where timezone <> 'Australia/Melbourne';

alter table public.health_log_reminders
add constraint health_log_reminders_timezone_melbourne
check (timezone = 'Australia/Melbourne');
