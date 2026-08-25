export const weightReminderFrequencies = [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
] as const;

export type WeightReminderFrequency =
  (typeof weightReminderFrequencies)[number];

export type WeightEntry = {
  createdAt: string;
  derivationTimezone: "Australia/Melbourne";
  id: string;
  localDate: string;
  ownerId: string;
  petId: string;
  source: "web";
  updatedAt: string;
  weightKg: number;
};

export type WeightReminder = {
  enabled: boolean;
  frequency: WeightReminderFrequency;
  localTime: string;
  ownerId: string;
  petId: string;
  scheduleDay: number;
  timezone: "Australia/Melbourne";
  updatedAt: string;
};

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Returns the first scheduled local date on or after `fromDate`. */
export function nextWeightReminderDate(
  fromDate: string,
  frequency: WeightReminderFrequency,
  scheduleDay: number,
) {
  const [year, month, day] = fromDate.split("-").map(Number);
  const from = new Date(Date.UTC(year!, month! - 1, day));

  if (frequency === "weekly" || frequency === "fortnightly") {
    const offset = (scheduleDay - from.getUTCDay() + 7) % 7;
    from.setUTCDate(from.getUTCDate() + offset);
    return from.toISOString().slice(0, 10);
  }

  const interval = frequency === "monthly" ? 1 : 3;
  let monthIndex = from.getUTCFullYear() * 12 + from.getUTCMonth();
  while (true) {
    const candidateYear = Math.floor(monthIndex / 12);
    const candidateMonth = monthIndex % 12;
    const candidate = new Date(
      Date.UTC(
        candidateYear,
        candidateMonth,
        Math.min(scheduleDay, daysInMonth(candidateYear, candidateMonth)),
      ),
    );
    if (candidate >= from) return candidate.toISOString().slice(0, 10);
    monthIndex += interval;
  }
}

export function weightTrendWindow(entries: Pick<WeightEntry, "localDate">[]) {
  if (entries.length < 2) return 30;
  const newest = Date.parse(`${entries.at(-1)!.localDate}T00:00:00Z`);
  const oldest = Date.parse(`${entries[0]!.localDate}T00:00:00Z`);
  const span = Math.round((newest - oldest) / 86_400_000);
  return span <= 30 ? 30 : span <= 90 ? 90 : 180;
}
