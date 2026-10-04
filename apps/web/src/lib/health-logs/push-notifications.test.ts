import { afterEach, describe, expect, it, vi } from "vitest";

import { enablePushNotifications } from "./push-notifications";

describe("push notification setup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("replaces a subscription created with an old VAPID key", async () => {
    vi.stubEnv("NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY", "AQID");
    const unsubscribe = vi.fn().mockResolvedValue(true);
    const subscribe = vi.fn().mockResolvedValue({
      options: { applicationServerKey: new Uint8Array([1, 2, 3]).buffer },
      toJSON: () => ({
        endpoint: "https://push.example.test/new",
        keys: { auth: "auth", p256dh: "key" },
      }),
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue({
              endpoint: "https://push.example.test/old",
              options: { applicationServerKey: new Uint8Array([9]).buffer },
              unsubscribe,
            }),
            subscribe,
          },
        }),
      },
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(enablePushNotifications()).resolves.toEqual({ ok: true });
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(subscribe).toHaveBeenCalledWith({
      applicationServerKey: new Uint8Array([1, 2, 3]),
      userVisibleOnly: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/push-subscriptions",
      expect.objectContaining({
        body: JSON.stringify({
          endpoint: "https://push.example.test/old",
        }),
        method: "DELETE",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/push-subscriptions",
      expect.objectContaining({
        body: JSON.stringify({
          auth: "auth",
          endpoint: "https://push.example.test/new",
          p256dh: "key",
        }),
        method: "POST",
      }),
    );
  });
});
