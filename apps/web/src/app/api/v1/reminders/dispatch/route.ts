import * as Sentry from "@sentry/nextjs";
import { healthLogReminderDispatchResponseSchema } from "@petmosphere/api-contracts";
import { dispatchReminders } from "@petmosphere/services";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createWebPushSender } from "@/lib/health-logs/web-push-sender";
import { createReminderDeliveryRepository } from "@/lib/reminders/supabase-reminder-delivery";
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
  if (!isAuthorised(request))
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  try {
    const result = await dispatchReminders(
      createReminderDeliveryRepository(createAdminClient()),
      createWebPushSender(),
    );
    if (result.failed > 0)
      console.warn(
        JSON.stringify({
          failed: result.failed,
          operation: "reminder_dispatch",
          status: "partial_failure",
        }),
      );
    return NextResponse.json(
      healthLogReminderDispatchResponseSchema.parse(result),
    );
  } catch {
    Sentry.captureMessage("Reminder dispatch failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_dispatch" },
    });
    return NextResponse.json(
      { message: "Reminder delivery failed." },
      { status: 500 },
    );
  }
}
