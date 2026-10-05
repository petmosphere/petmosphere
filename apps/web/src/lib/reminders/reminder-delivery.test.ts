import { dispatchReminders } from "@petmosphere/services";
import { describe, expect, it, vi } from "vitest";

describe("reminder delivery", () => {
  it("creates the next occurrence before delivering overdue reminders", async () => {
    const createNextOccurrence = vi.fn(async () => undefined);
    const now = new Date("2026-09-23T00:00:00.000Z");

    await dispatchReminders(
      {
        claimDue: async () => [],
        createNextOccurrence,
        listOverdueRecurring: async () => [
          {
            id: "77000000-0000-4000-8000-000000000007",
            repeatRule: "monthly",
            seriesStartDate: "2026-08-22",
            timezone: "Australia/Melbourne",
          },
        ],
        listSubscriptions: async () => [],
        removeSubscription: async () => undefined,
      },
      { send: vi.fn() },
      now,
    );

    expect(createNextOccurrence).toHaveBeenCalledWith(
      "77000000-0000-4000-8000-000000000007",
      "2026-10-22",
    );
  });

  it("sends the pet-specific inbox message and removes expired subscriptions", async () => {
    const send = vi.fn(async () => "expired" as const);
    const removeSubscription = vi.fn(async () => undefined);
    const result = await dispatchReminders(
      {
        claimDue: async () => [
          {
            id: "77000000-0000-4000-8000-000000000007",
            message: "A reminder for Cookie is coming up.",
            ownerId: "71000000-0000-4000-8000-000000000001",
          },
        ],
        createNextOccurrence: async () => undefined,
        listOverdueRecurring: async () => [],
        listSubscriptions: async () => [
          {
            auth: "auth",
            endpoint: "https://push.test/one",
            id: "subscription-one",
            p256dh: "key",
          },
        ],
        removeSubscription,
      },
      { send },
    );

    expect(result).toEqual({ claimed: 1, expired: 1, failed: 0, sent: 0 });
    expect(send).toHaveBeenCalledWith(expect.any(Object), {
      body: "A reminder for Cookie is coming up.",
      tag: "petmosphere-reminder-77000000-0000-4000-8000-000000000007",
      url: "/reminders/77000000-0000-4000-8000-000000000007",
    });
    expect(removeSubscription).toHaveBeenCalledWith("subscription-one");
  });
});
