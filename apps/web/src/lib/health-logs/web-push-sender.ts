import type { WebPushSender } from "@petmosphere/services";
import * as Sentry from "@sentry/nextjs";
import { setTimeout as delay } from "node:timers/promises";
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
  return {
    async send(subscription, notification) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          // Inbox records are claimed before push delivery; missing push config
          // must not prevent that independent channel from working.
          const vapidDetails = getWebPushConfig();
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
              urgency: "high",
              timeout: 5_000,
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
          const transient =
            (error instanceof Error && error.message === "Socket timeout") ||
            statusCode === 429 ||
            (typeof statusCode === "number" && statusCode >= 500) ||
            (error instanceof Error &&
              "code" in error &&
              ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ECONNREFUSED"].includes(
                String(error.code),
              ));
          if (transient && attempt < 2) {
            await delay(500 * 2 ** attempt);
            continue;
          }
          // Provider errors can contain private endpoints and encryption keys.
          Sentry.captureMessage("Web Push delivery failed.", {
            level: "error",
            tags: {
              operation: "web_push_send",
              status:
                typeof statusCode === "number"
                  ? String(statusCode)
                  : "unavailable",
            },
          });
          throw error;
        }
      }
      throw new Error("Web Push retry limit exceeded.");
    },
  };
}
