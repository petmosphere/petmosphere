export type DueHealthLogReminder = {
  localDate: string;
  ownerId: string;
  petId: string;
};

export type StoredWebPushSubscription = {
  auth: string;
  endpoint: string;
  id: string;
  p256dh: string;
};

export type HealthLogReminderDeliveryRepository = {
  claimDue(limit: number, now: Date): Promise<DueHealthLogReminder[]>;
  listSubscriptions(ownerId: string): Promise<StoredWebPushSubscription[]>;
  removeSubscription(id: string): Promise<void>;
};

export type WebPushSender = {
  send(subscription: StoredWebPushSubscription): Promise<"expired" | "sent">;
};

export async function dispatchHealthLogReminders(
  repository: HealthLogReminderDeliveryRepository,
  sender: WebPushSender,
  now = new Date(),
  limit = 100,
) {
  const reminders = await repository.claimDue(limit, now);
  const result = { claimed: reminders.length, expired: 0, failed: 0, sent: 0 };

  for (const reminder of reminders) {
    const subscriptions = await repository.listSubscriptions(reminder.ownerId);
    for (const subscription of subscriptions) {
      try {
        const outcome = await sender.send(subscription);
        if (outcome === "expired") {
          await repository.removeSubscription(subscription.id);
          result.expired += 1;
        } else {
          result.sent += 1;
        }
      } catch {
        result.failed += 1;
      }
    }
  }

  return result;
}
