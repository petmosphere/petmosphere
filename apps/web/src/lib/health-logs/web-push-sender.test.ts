import {
  dispatchHealthLogReminders,
  dispatchReminders,
  dispatchWeightReminders,
} from "@petmosphere/services";
import { afterEach, expect, it, vi } from "vitest";

import { createWebPushSender } from "./web-push-sender";

vi.mock("web-push", () => ({ sendNotification: vi.fn() }));
afterEach(() => vi.unstubAllEnvs());

it.each([
  "NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY",
  "WEB_PUSH_VAPID_PRIVATE_KEY",
  "WEB_PUSH_SUBJECT",
])("keeps inbox dispatch working when %s is missing", async (missing) => {
  vi.stubEnv("NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY", "test-public-key");
  vi.stubEnv("WEB_PUSH_VAPID_PRIVATE_KEY", "test-private-key");
  vi.stubEnv("WEB_PUSH_SUBJECT", "mailto:test@example.test");
  vi.stubEnv(missing, "");
  const claimDue = vi.fn(async () => [
    {
      id: "reminder",
      ownerId: "owner",
      petId: "pet",
      localDate: "2026-10-04",
    },
  ]);
  const repository = {
    claimDue,
    listSubscriptions: async () => [
      {
        id: "subscription",
        endpoint: "https://push.example.test/one",
        auth: "test",
        p256dh: "test",
      },
    ],
    removeSubscription: vi.fn(),
  };
  for (const dispatch of [
    dispatchHealthLogReminders,
    dispatchReminders,
    dispatchWeightReminders,
  ]) {
    const result = await dispatch(repository, createWebPushSender());
    expect(result).toEqual({ claimed: 1, sent: 0, expired: 0, failed: 1 });
  }
  expect(claimDue).toHaveBeenCalledTimes(3);
  expect(repository.removeSubscription).not.toHaveBeenCalled();
});
