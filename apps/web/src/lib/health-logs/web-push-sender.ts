import type { WebPushSender } from "@petmosphere/services";
import * as webPush from "web-push";

function getWebPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push delivery is not configured.");
  }

  return { privateKey, publicKey, subject };
}

export function createWebPushSender(): WebPushSender {
  const vapidDetails = getWebPushConfig();

  return {
    async send(subscription, notification) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { auth: subscription.auth, p256dh: subscription.p256dh },
          },
          notification
            ? JSON.stringify({
                body: notification.body,
                tag: notification.tag,
                url: notification.url,
              })
            : null,
          {
            TTL: 3_600,
            ...(notification ? {} : { topic: "petmosphere-daily-check-in" }),
            urgency: "normal",
            vapidDetails,
          },
        );
        return "sent";
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? error.statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) return "expired";
        throw error;
      }
    },
  };
}
