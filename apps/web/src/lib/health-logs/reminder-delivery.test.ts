import { dispatchHealthLogReminders } from "@petmosphere/services";
import { describe, expect, it, vi } from "vitest";

describe("health log reminder delivery", () => {
  it("removes expired subscriptions and reports failures without exposing payloads", async () => {
    const removed: string[] = [];
    const send = vi.fn(async (subscription: { id: string }) => {
      if (subscription.id === "two") return "expired" as const;
      if (subscription.id === "three") throw new Error("provider failed");
      return "sent" as const;
    });
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
          {
            auth: "a",
            endpoint: "https://push.test/1",
            id: "one",
            p256dh: "p",
          },
          {
            auth: "a",
            endpoint: "https://push.test/2",
            id: "two",
            p256dh: "p",
          },
          {
            auth: "a",
            endpoint: "https://push.test/3",
            id: "three",
            p256dh: "p",
          },
        ],
        removeSubscription: async (id) => {
          removed.push(id);
        },
      },
      { send },
    );

    expect(result).toEqual({ claimed: 1, expired: 1, failed: 1, sent: 1 });
    expect(removed).toEqual(["two"]);
    expect(send).toHaveBeenCalledWith(expect.any(Object), {
      body: "It’s time for today’s pet check-in.",
      tag: "petmosphere-daily-check-in-20000000-0000-4000-8000-000000000002-2026-08-15",
      url: "/pets/20000000-0000-4000-8000-000000000002/health-logs/today",
    });
  });
});
