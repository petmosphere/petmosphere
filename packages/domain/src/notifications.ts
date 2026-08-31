export const notificationKinds = [
  "reminder_due",
  "daily_check_in",
  "weight_log",
  "reminder_completed",
] as const;

export type NotificationKind = (typeof notificationKinds)[number];

export type AppNotification = {
  createdAt: string;
  id: string;
  kind: NotificationKind;
  localDate: string | null;
  message: string;
  ownerId: string;
  petId: string | null;
  readAt: string | null;
  reminderId: string | null;
  title: string;
};
