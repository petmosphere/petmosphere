import { isReminderOverdue, nextReminderDate } from "@petmosphere/domain";
import { describe, expect, it } from "vitest";

describe("reminder recurrence", () => {
  it("marks a reminder overdue after its Melbourne local time", () => {
    const reminder = {
      dueDate: "2026-08-22",
      localTime: "19:00",
      timezone: "Australia/Melbourne" as const,
    };

    expect(isReminderOverdue(reminder, new Date("2026-08-22T08:59:59Z"))).toBe(
      false,
    );
    expect(isReminderOverdue(reminder, new Date("2026-08-22T09:00:01Z"))).toBe(
      true,
    );
  });

  it("skips overdue daily occurrences", () => {
    expect(nextReminderDate("2026-08-01", "daily", "2026-08-22")).toBe(
      "2026-08-23",
    );
  });

  it("preserves a monthly last-day anchor", () => {
    expect(nextReminderDate("2026-01-31", "monthly", "2026-02-28")).toBe(
      "2026-03-31",
    );
  });

  it("uses the last valid day for yearly leap-day recurrence", () => {
    expect(nextReminderDate("2024-02-29", "yearly", "2025-02-28")).toBe(
      "2026-02-28",
    );
  });
});
