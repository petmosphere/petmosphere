import * as Sentry from "@sentry/nextjs";
import { healthLogReminderDispatchResponseSchema } from "@petmosphere/api-contracts";
import { dispatchWeightReminders } from "@petmosphere/services";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createWebPushSender } from "@/lib/health-logs/web-push-sender";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWeightReminderDeliveryRepository } from "@/lib/weights/supabase-weight-reminder-delivery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer /, "");
  if (!secret || !supplied) return false;
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  if (!isAuthorised(request))
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  try {
    const result = await dispatchWeightReminders(
      createWeightReminderDeliveryRepository(createAdminClient()),
      createWebPushSender(),
    );
    return NextResponse.json(
      healthLogReminderDispatchResponseSchema.parse(result),
    );
  } catch {
    Sentry.captureMessage("Weight reminder dispatch failed unexpectedly.", {
      level: "error",
      tags: { operation: "weight_reminder_dispatch" },
    });
    return NextResponse.json(
      { message: "Reminder delivery failed." },
      { status: 500 },
    );
  }
}
