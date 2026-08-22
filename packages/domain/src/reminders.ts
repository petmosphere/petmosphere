export const reminderCategories = [
  "vaccination",
  "medication",
  "vet_visit",
  "grooming",
  "other",
] as const;

export const reminderRepeatRules = [
  "never",
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "yearly",
] as const;

export type ReminderCategory = (typeof reminderCategories)[number];
export type ReminderRepeatRule = (typeof reminderRepeatRules)[number];

export type Reminder = {
  completedAt: string | null;
  createdAt: string;
  creationRequestId: string;
  deletedAt: string | null;
  dueDate: string;
  id: string;
  localTime: string;
  note: string | null;
  notifiedAt: string | null;
  ownerId: string;
  petId: string;
  repeatRule: ReminderRepeatRule;
  seriesId: string;
  seriesStartDate: string;
  timezone: "Australia/Melbourne";
  title: string;
  category: ReminderCategory;
  updatedAt: string;
};

export type NewReminder = Omit<
  Reminder,
  "completedAt" | "createdAt" | "deletedAt" | "notifiedAt" | "updatedAt"
>;

export function isReminderOverdue(
  reminder: Pick<Reminder, "dueDate" | "localTime" | "timezone">,
  now = new Date(),
) {
  const due = `${reminder.dueDate}T${reminder.localTime}:00`;
  const current = `${deriveLocalDate(now, reminder.timezone)}T${deriveLocalTime(now, reminder.timezone)}`;
  return due < current;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day));
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Returns the first scheduled occurrence strictly after `afterDate`. */
export function nextReminderDate(
  seriesStartDate: string,
  repeatRule: ReminderRepeatRule,
  afterDate: string,
): string | null {
  if (repeatRule === "never") return null;

  const start = parseDate(seriesStartDate);
  const after = parseDate(afterDate);
  if (
    repeatRule === "daily" ||
    repeatRule === "weekly" ||
    repeatRule === "fortnightly"
  ) {
    const interval =
      repeatRule === "daily" ? 1 : repeatRule === "weekly" ? 7 : 14;
    const elapsedDays = Math.floor(
      (after.getTime() - start.getTime()) / 86_400_000,
    );
    const intervals = Math.max(1, Math.floor(elapsedDays / interval) + 1);
    start.setUTCDate(start.getUTCDate() + intervals * interval);
    return formatDate(start);
  }

  const anchorDay = start.getUTCDate();
  if (repeatRule === "monthly") {
    let monthIndex = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const afterMonthIndex = after.getUTCFullYear() * 12 + after.getUTCMonth();
    monthIndex = Math.max(monthIndex + 1, afterMonthIndex);
    while (true) {
      const year = Math.floor(monthIndex / 12);
      const month = monthIndex % 12;
      const candidate = new Date(
        Date.UTC(year, month, Math.min(anchorDay, daysInMonth(year, month))),
      );
      if (candidate > after) return formatDate(candidate);
      monthIndex += 1;
    }
  }

  const anchorMonth = start.getUTCMonth();
  let year = Math.max(start.getUTCFullYear() + 1, after.getUTCFullYear());
  while (true) {
    const candidate = new Date(
      Date.UTC(
        year,
        anchorMonth,
        Math.min(anchorDay, daysInMonth(year, anchorMonth)),
      ),
    );
    if (candidate > after) return formatDate(candidate);
    year += 1;
  }
}
import { deriveLocalDate, deriveLocalTime } from "./health-logs";
