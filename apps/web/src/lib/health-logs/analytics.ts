import type { HealthLogAnalyticsEvent } from "@petmosphere/api-contracts";

export function trackHealthLogEvent(event: HealthLogAnalyticsEvent) {
  void fetch("/api/v1/health-log-events", {
    body: JSON.stringify(event),
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined);
}
