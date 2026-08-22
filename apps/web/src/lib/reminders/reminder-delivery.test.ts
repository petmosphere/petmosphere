import { dispatchReminders } from "@petmosphere/services";
import { describe, expect, it, vi } from "vitest";

describe("reminder delivery", () => {
  it("sends a generic notification and removes expired subscriptions", async () => {
    const send = vi.fn(async () => "expired" as const);
    const removeSubscription = vi.fn(async () => undefined);
    const result = await dispatchReminders(
      {
        claimDue: async () => [
          {
            id: "77000000-0000-4000-8000-000000000007",
            ownerId: "71000000-0000-4000-8000-000000000001",
          },
        ],
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
      body: "A pet care reminder is due.",
      tag: "petmosphere-reminder-77000000-0000-4000-8000-000000000007",
      url: "/reminders/77000000-0000-4000-8000-000000000007",
    });
    expect(removeSubscription).toHaveBeenCalledWith("subscription-one");
  });
});
