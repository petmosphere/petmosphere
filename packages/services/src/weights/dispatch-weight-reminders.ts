import type {
  StoredWebPushSubscription,
  WebPushSender,
} from "../health-logs/dispatch-health-log-reminders";

export type DueWeightReminder = { ownerId: string; petId: string };

export type WeightReminderDeliveryRepository = {
  claimDue(limit: number, now: Date): Promise<DueWeightReminder[]>;
  listSubscriptions(ownerId: string): Promise<StoredWebPushSubscription[]>;
  removeSubscription(id: string): Promise<void>;
};

export async function dispatchWeightReminders(
  repository: WeightReminderDeliveryRepository,
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
        const outcome = await sender.send(subscription, {
          body: "It’s time to update your pet’s weight.",
          tag: `petmosphere-weight-${reminder.petId}`,
          url: `/pets/${reminder.petId}/weight`,
        });
        if (outcome === "expired") {
          await repository.removeSubscription(subscription.id);
          result.expired += 1;
        } else result.sent += 1;
      } catch {
        result.failed += 1;
      }
    }
  }
  return result;
}
