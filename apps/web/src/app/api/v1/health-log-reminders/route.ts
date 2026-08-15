import * as Sentry from "@sentry/nextjs";
import {
  healthLogReminderResponseSchema,
  healthLogReminderSchema,
} from "@petmosphere/api-contracts";
import {
  getHealthLogReminder,
  PetMembershipError,
  saveHealthLogReminder,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import { createHealthLogReminderRepository } from "@/lib/health-logs/supabase-health-log-reminders";
import { createHealthLogRepository } from "@/lib/health-logs/supabase-health-logs";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

function notFound(error: unknown) {
  return error instanceof PetMembershipError
    ? NextResponse.json({ message: "Pet not found." }, { status: 404 })
    : null;
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to view reminders." },
      { status: 401 },
    );
  try {
    const parsed = healthLogReminderSchema
      .pick({ petId: true })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { message: "Check the reminder request." },
        { status: 400 },
      );
    const reminder = await getHealthLogReminder(
      user.id,
      parsed.data.petId,
      createHealthLogRepository(supabase),
      createHealthLogReminderRepository(supabase),
    );
    return NextResponse.json(
      reminder ? healthLogReminderResponseSchema.parse(reminder) : null,
    );
  } catch (error) {
    const response = notFound(error);
    if (response) return response;
    Sentry.captureMessage("Health log reminder lookup failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_log_reminder_lookup" },
    });
    return NextResponse.json(
      { message: "We could not load the reminder." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to save reminders." },
      { status: 401 },
    );
  try {
    const parsed = healthLogReminderSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Check the reminder." },
        { status: 400 },
      );
    const reminder = await saveHealthLogReminder(
      user.id,
      parsed.data,
      createHealthLogRepository(supabase),
      createHealthLogReminderRepository(supabase),
    );
    return NextResponse.json(healthLogReminderResponseSchema.parse(reminder));
  } catch (error) {
    const response = notFound(error);
    if (response) return response;
    Sentry.captureMessage("Health log reminder save failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_log_reminder_save" },
    });
    return NextResponse.json(
      { message: "We could not save the reminder. Try again." },
      { status: 500 },
    );
  }
}
