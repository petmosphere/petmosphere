import {
  deriveLocalDate,
  nextReminderDate,
  type ReminderRepeatRule,
} from "@petmosphere/domain";

import type {
  StoredWebPushSubscription,
  WebPushSender,
} from "../health-logs/dispatch-health-log-reminders";

export type DueReminderNotification = {
  id: string;
  message: string;
  ownerId: string;
};
export type OverdueRecurringReminder = {
  id: string;
  repeatRule: ReminderRepeatRule;
  seriesStartDate: string;
  timezone: "Australia/Melbourne";
};

export type ReminderDeliveryRepository = {
  claimDue(limit: number, now: Date): Promise<DueReminderNotification[]>;
  createNextOccurrence(reminderId: string, nextDueDate: string): Promise<void>;
  listOverdueRecurring(
    limit: number,
    now: Date,
  ): Promise<OverdueRecurringReminder[]>;
  listSubscriptions(ownerId: string): Promise<StoredWebPushSubscription[]>;
  removeSubscription(id: string): Promise<void>;
};

export async function dispatchReminders(
  repository: ReminderDeliveryRepository,
  sender: WebPushSender,
  now = new Date(),
  limit = 100,
) {
  const overdue = await repository.listOverdueRecurring(limit, now);
  for (const reminder of overdue) {
    const nextDueDate = nextReminderDate(
      reminder.seriesStartDate,
      reminder.repeatRule,
      deriveLocalDate(now, reminder.timezone),
    );
    if (nextDueDate) {
      await repository.createNextOccurrence(reminder.id, nextDueDate);
    }
  }

  const reminders = await repository.claimDue(limit, now);
  const result = { claimed: reminders.length, expired: 0, failed: 0, sent: 0 };
  for (const reminder of reminders) {
    const subscriptions = await repository.listSubscriptions(reminder.ownerId);
    for (const subscription of subscriptions) {
      try {
        const outcome = await sender.send(subscription, {
          body: reminder.message,
          tag: `petmosphere-reminder-${reminder.id}`,
          url: `/reminders/${reminder.id}`,
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
