import * as Sentry from "@sentry/nextjs";
import { healthLogReminderDispatchResponseSchema } from "@petmosphere/api-contracts";
import { dispatchHealthLogReminders } from "@petmosphere/services";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createHealthLogReminderDeliveryRepository } from "@/lib/health-logs/supabase-reminder-delivery";
import { createWebPushSender } from "@/lib/health-logs/web-push-sender";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer /, "");
  if (!secret || !supplied) return false;

  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }

  try {
    const result = await dispatchHealthLogReminders(
      createHealthLogReminderDeliveryRepository(createAdminClient()),
      createWebPushSender(),
    );
    if (result.failed > 0) {
      console.warn(
        JSON.stringify({
          failed: result.failed,
          operation: "health_log_reminder_dispatch",
          status: "partial_failure",
        }),
      );
    }
    return NextResponse.json(
      healthLogReminderDispatchResponseSchema.parse(result),
    );
  } catch {
    Sentry.captureMessage("Health log reminder dispatch failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_log_reminder_dispatch" },
    });
    return NextResponse.json(
      { message: "Reminder delivery failed." },
      { status: 500 },
    );
  }
}
