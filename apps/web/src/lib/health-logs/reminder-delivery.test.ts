import { dispatchHealthLogReminders } from "@petmosphere/services";
import { describe, expect, it } from "vitest";

describe("health log reminder delivery", () => {
  it("removes expired subscriptions and reports failures without exposing payloads", async () => {
    const removed: string[] = [];
    const result = await dispatchHealthLogReminders(
      {
        claimDue: async () => [
          {
            localDate: "2026-08-15",
            ownerId: "10000000-0000-4000-8000-000000000001",
            petId: "20000000-0000-4000-8000-000000000002",
          },
        ],
        listSubscriptions: async () => [
          { auth: "a", endpoint: "https://push.test/1", id: "one", p256dh: "p" },
          { auth: "a", endpoint: "https://push.test/2", id: "two", p256dh: "p" },
          { auth: "a", endpoint: "https://push.test/3", id: "three", p256dh: "p" },
        ],
        removeSubscription: async (id) => {
          removed.push(id);
        },
      },
      {
        send: async (subscription) => {
          if (subscription.id === "two") return "expired";
          if (subscription.id === "three") throw new Error("provider failed");
          return "sent";
        },
      },
    );

    expect(result).toEqual({ claimed: 1, expired: 1, failed: 1, sent: 1 });
    expect(removed).toEqual(["two"]);
  });
});
