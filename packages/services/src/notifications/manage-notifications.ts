import type { AppNotification } from "@petmosphere/domain";

export type NotificationRepository = {
  countUnread(ownerId: string, visibleAfter: Date): Promise<number>;
  list(ownerId: string, visibleAfter: Date): Promise<AppNotification[]>;
  markAllRead(ownerId: string, readAt: Date): Promise<void>;
  markRead(
    ownerId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<void>;
};

export function notificationVisibleAfter(now = new Date()) {
  return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1_000);
}

export async function listNotifications(
  ownerId: string,
  repository: NotificationRepository,
  now = new Date(),
) {
  const visibleAfter = notificationVisibleAfter(now);
  const [notifications, unreadCount] = await Promise.all([
    repository.list(ownerId, visibleAfter),
    repository.countUnread(ownerId, visibleAfter),
  ]);
  return { notifications, unreadCount };
}

export function markAllNotificationsRead(
  ownerId: string,
  repository: NotificationRepository,
  now = new Date(),
) {
  return repository.markAllRead(ownerId, now);
}

export function markNotificationRead(
  ownerId: string,
  notificationId: string,
  repository: NotificationRepository,
  now = new Date(),
) {
  return repository.markRead(ownerId, notificationId, now);
}
