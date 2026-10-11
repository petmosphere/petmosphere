# Time zone preferences

- Profile → Time zone stores an optional, user-owned IANA time zone. The picker
  supports worldwide cities and regions. With no manual choice, new schedules
  use the device's detected time zone.
- If detection fails and no preference exists, users choose a time zone before
  creating a reminder, daily check-in notification, or weight notification.
- Each schedule stores its own time zone. Changing the profile preference does
  **not** move existing reminders; users can change those individually when
  editing them. This avoids silently shifting notification times while
  travelling or switching devices.
- Profile time zone also determines the default local date for new diary and
  weight entries and the Today grouping on server-rendered home and inbox
  pages. Existing entries retain their recorded local date and time zone.
