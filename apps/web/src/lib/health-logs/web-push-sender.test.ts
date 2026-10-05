import {
  dispatchHealthLogReminders,
  dispatchReminders,
  dispatchWeightReminders,
} from "@petmosphere/services";
import { afterEach, expect, it, vi } from "vitest";
import * as webPush from "web-push";
import * as Sentry from "@sentry/nextjs";

import { createWebPushSender } from "./web-push-sender";

vi.mock("web-push", () => ({ sendNotification: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));
vi.mock("node:timers/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:timers/promises")>()),
  setTimeout: vi.fn(async () => undefined),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

const subscription = {
  id: "test",
  endpoint: "https://push.example.test/private",
  auth: "private-auth",
  p256dh: "private-key",
};
function configurePush() {
  vi.stubEnv("NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY", "test-public-key");
  vi.stubEnv("WEB_PUSH_VAPID_PRIVATE_KEY", "test-private-key");
  vi.stubEnv("WEB_PUSH_SUBJECT", "mailto:test@example.test");
}

it.each([503, 429, "ECONNRESET", "Socket timeout"])(
  "retries temporary push failure %s and preserves the reminder destination",
  async (failure) => {
    configurePush();
    const error =
      typeof failure === "number"
        ? { statusCode: failure }
        : Object.assign(new Error(failure), { code: failure });
    vi.mocked(webPush.sendNotification)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ statusCode: 201, headers: {}, body: "" });
    await expect(
      createWebPushSender().send(subscription, {
        body: "A pet care reminder is due.",
        tag: "reminder-one",
        url: "/reminders/one",
      }),
    ).resolves.toBe("sent");
    expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
    expect(webPush.sendNotification).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.stringContaining('"url":"/reminders/one"'),
      expect.objectContaining({ urgency: "high", timeout: 5000 }),
    );
  },
);

it.each([400, 403, 404, 410, 503])(
  "bounds attempts for provider status %s without leaking subscription details",
  async (statusCode) => {
    configurePush();
    vi.mocked(webPush.sendNotification).mockRejectedValue({
      statusCode,
      endpoint: subscription.endpoint,
    });
    const result = createWebPushSender().send(subscription);
    if (statusCode === 404 || statusCode === 410)
      await expect(result).resolves.toBe("expired");
    else
      await expect(result).rejects.toEqual(
        expect.objectContaining({ statusCode }),
      );
    expect(webPush.sendNotification).toHaveBeenCalledTimes(
      statusCode === 503 ? 3 : 1,
    );
    expect(
      JSON.stringify(vi.mocked(Sentry.captureMessage).mock.calls),
    ).not.toContain(subscription.endpoint);
  },
);

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
    createNextOccurrence: vi.fn(),
    listOverdueRecurring: async () => [],
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
