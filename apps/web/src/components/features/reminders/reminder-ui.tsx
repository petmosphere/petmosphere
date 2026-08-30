import { Bell, CalendarHeart, Cross, Scissors, ShieldPlus } from "lucide-react";

import {
  reminderNotificationLeadMinutes,
  type ReminderCategory,
  type ReminderNotificationLeadMinutes,
  type ReminderRepeatRule,
} from "@petmosphere/domain";

export const categoryDetails = {
  vaccination: {
    Icon: ShieldPlus,
    emoji: "💉",
    label: "Vaccination",
    colours: "bg-[#fff0df] text-[#ed802a]",
  },
  medication: {
    Icon: Cross,
    emoji: "💊",
    label: "Medication",
    colours: "bg-[#e5f7f5] text-[#51aaa6]",
  },
  vet_visit: {
    Icon: CalendarHeart,
    emoji: "🏥",
    label: "Vet visit",
    colours: "bg-[#eef6e6] text-[#76a94e]",
  },
  grooming: {
    Icon: Scissors,
    emoji: "✂️",
    label: "Grooming",
    colours: "bg-[#f4ebff] text-[#9667b5]",
  },
  other: {
    Icon: Bell,
    emoji: "📋",
    label: "Other",
    colours: "bg-[#f2f0ed] text-stone-600",
  },
} satisfies Record<
  ReminderCategory,
  { Icon: typeof Bell; colours: string; emoji: string; label: string }
>;

export const repeatLabels = {
  never: "Never",
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  yearly: "Yearly",
} satisfies Record<ReminderRepeatRule, string>;

export const notificationLeadLabels: Record<
  ReminderNotificationLeadMinutes,
  string
> = {
  0: "At the time of the reminder",
  5: "5 minutes before",
  15: "15 minutes before",
  30: "30 minutes before",
  60: "1 hour before",
  120: "2 hours before",
  1440: "1 day before",
  2880: "2 days before",
  10080: "1 week before",
  43200: "1 month before",
};

export const notificationLeadOptions = [
  ...reminderNotificationLeadMinutes.map((value) => ({
    label: notificationLeadLabels[value],
    value,
  })),
  { label: "None", value: null },
] as const;

export function formatNotificationLead(value: number | null) {
  return value === null
    ? "None"
    : (notificationLeadLabels[value as ReminderNotificationLeadMinutes] ??
        "At the time of the reminder");
}

export function formatReminderDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatReminderTime(time: string) {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`2026-01-01T${time}:00Z`));
}
