import * as Sentry from "@sentry/nextjs";
import { completeReminder, ReminderNotFoundError } from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ reminderId: string }> },
) {
  const { reminderId } = await params;
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user)
    return NextResponse.json(
      { message: "Sign in to complete this reminder." },
      { status: 401 },
    );
  try {
    const result = await completeReminder(
      data.user.id,
      reminderId,
      createReminderRepository(supabase),
    );
    return NextResponse.json({
      completed: toReminderResponse(result.completed),
      next: result.next ? toReminderResponse(result.next) : null,
    });
  } catch (error) {
    if (error instanceof ReminderNotFoundError)
      return NextResponse.json(
        { message: "Reminder not found." },
        { status: 404 },
      );
    Sentry.captureMessage("Reminder completion failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_complete" },
    });
    return NextResponse.json(
      { message: "We could not complete this reminder. Try again." },
      { status: 500 },
    );
  }
}
