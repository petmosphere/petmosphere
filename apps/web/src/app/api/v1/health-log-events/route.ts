import {
  healthLogAnalyticsEventSchema,
  type HealthLogAnalyticsEvent,
} from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function toRow(event: HealthLogAnalyticsEvent) {
  if (event.event !== "health_log_completed") {
    return { event_name: event.event };
  }
  return {
    event_name: event.event,
    image_count: event.imageCount,
    optional_field_count: event.optionalFieldCount,
    time_to_complete_ms: event.timeToCompleteMs,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return new NextResponse(null, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const parsed = healthLogAnalyticsEventSchema.safeParse(payload);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const { error: insertError } = await supabase
    .from("health_log_analytics_events")
    .insert(toRow(parsed.data));
  return new NextResponse(null, { status: insertError ? 503 : 204 });
}
