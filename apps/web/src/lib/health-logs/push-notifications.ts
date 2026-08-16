type PushSetupFailure = "configuration" | "denied" | "save" | "unsupported";

export type PushSetupResult =
  { ok: true } | { ok: false; reason: PushSetupFailure };

function decodeVapidPublicKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function enablePushNotifications(): Promise<PushSetupResult> {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { ok: false, reason: "unsupported" };
  }

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, reason: "configuration" };

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return { ok: false, reason: "denied" };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        applicationServerKey: decodeVapidPublicKey(publicKey),
        userVisibleOnly: true,
      }));
    const serialised = subscription.toJSON();
    if (
      !serialised.endpoint ||
      !serialised.keys?.auth ||
      !serialised.keys.p256dh
    ) {
      return { ok: false, reason: "save" };
    }

    const response = await fetch("/api/v1/push-subscriptions", {
      body: JSON.stringify({
        auth: serialised.keys.auth,
        endpoint: serialised.endpoint,
        p256dh: serialised.keys.p256dh,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    return response.ok ? { ok: true } : { ok: false, reason: "save" };
  } catch {
    return { ok: false, reason: "save" };
  }
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await Promise.allSettled([
      fetch("/api/v1/push-subscriptions", {
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      }),
      subscription.unsubscribe(),
    ]);
  } catch {
    // Signing out must continue even when browser notification cleanup fails.
  }
}
