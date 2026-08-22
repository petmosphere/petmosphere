import * as Sentry from "@sentry/nextjs";
import {
  createReminderSchema,
  reminderStatusSchema,
} from "@petmosphere/api-contracts";
import { deriveLocalDate, deriveLocalTime } from "@petmosphere/domain";
import {
  createReminder,
  ReminderPastDateError,
  ReminderPetAccessError,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";
import { createClient } from "@/lib/supabase/server";

async function requireApiUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function GET(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to view reminders." },
      { status: 401 },
    );
  const parsed = reminderStatusSchema.safeParse(
    new URL(request.url).searchParams.get("status") ?? "upcoming",
  );
  if (!parsed.success)
    return NextResponse.json(
      { message: "Choose a valid reminder list." },
      { status: 400 },
    );
  try {
    const now = new Date();
    const localDate = deriveLocalDate(now, "Australia/Melbourne");
    const localTime = deriveLocalTime(now, "Australia/Melbourne");
    const reminders = await createReminderRepository(supabase).list(
      user.id,
      parsed.data,
      localDate,
      localTime,
    );
    return NextResponse.json(reminders.map(toReminderResponse));
  } catch {
    Sentry.captureMessage("Reminder list failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_list" },
    });
    return NextResponse.json(
      { message: "We could not load reminders. Try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to create a reminder." },
      { status: 401 },
    );
  const parsed = createReminderSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        message:
          parsed.error.issues[0]?.message ?? "Check the reminder details.",
      },
      { status: 400 },
    );
  try {
    const result = await createReminder(
      user.id,
      { ...parsed.data, note: parsed.data.note ?? null },
      createReminderRepository(supabase),
    );
    return NextResponse.json(toReminderResponse(result.reminder), {
      status: result.created ? 201 : 200,
    });
  } catch (error) {
    if (error instanceof ReminderPastDateError)
      return NextResponse.json({ message: error.message }, { status: 400 });
    if (error instanceof ReminderPetAccessError)
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    Sentry.captureMessage("Reminder creation failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_create" },
    });
    return NextResponse.json(
      { message: "We could not save this reminder. Try again." },
      { status: 500 },
    );
  }
}
