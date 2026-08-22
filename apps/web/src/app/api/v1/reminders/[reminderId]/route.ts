import * as Sentry from "@sentry/nextjs";
import { updateReminderSchema } from "@petmosphere/api-contracts";
import {
  deleteReminder,
  ReminderNotFoundError,
  ReminderPastDateError,
  ReminderPetAccessError,
  updateReminder,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";
import { createClient } from "@/lib/supabase/server";

async function context(params: Promise<{ reminderId: string }>) {
  const { reminderId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return {
    reminderId,
    repository: createReminderRepository(supabase),
    supabase,
    user: error ? null : data.user,
  };
}

function knownError(error: unknown) {
  if (
    error instanceof ReminderNotFoundError ||
    error instanceof ReminderPetAccessError
  )
    return NextResponse.json(
      { message: "Reminder not found." },
      { status: 404 },
    );
  if (error instanceof ReminderPastDateError)
    return NextResponse.json({ message: error.message }, { status: 400 });
  return null;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ reminderId: string }> },
) {
  const { reminderId, repository, user } = await context(params);
  if (!user)
    return NextResponse.json(
      { message: "Sign in to view this reminder." },
      { status: 401 },
    );
  try {
    const reminder = await repository.findById(user.id, reminderId);
    if (!reminder || reminder.deletedAt)
      return NextResponse.json(
        { message: "Reminder not found." },
        { status: 404 },
      );
    return NextResponse.json(toReminderResponse(reminder));
  } catch {
    Sentry.captureMessage("Reminder read failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_read" },
    });
    return NextResponse.json(
      { message: "We could not load this reminder. Try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reminderId: string }> },
) {
  const { reminderId, repository, user } = await context(params);
  if (!user)
    return NextResponse.json(
      { message: "Sign in to update this reminder." },
      { status: 401 },
    );
  const parsed = updateReminderSchema.safeParse({
    ...(await request.json().catch(() => ({}))),
    reminderId,
  });
  if (!parsed.success)
    return NextResponse.json(
      {
        message:
          parsed.error.issues[0]?.message ?? "Check the reminder details.",
      },
      { status: 400 },
    );
  try {
    const reminder = await updateReminder(
      user.id,
      reminderId,
      { ...parsed.data, note: parsed.data.note ?? null },
      repository,
    );
    return NextResponse.json(toReminderResponse(reminder));
  } catch (error) {
    const response = knownError(error);
    if (response) return response;
    Sentry.captureMessage("Reminder update failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_update" },
    });
    return NextResponse.json(
      { message: "We could not update this reminder. Try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ reminderId: string }> },
) {
  const { reminderId, repository, user } = await context(params);
  if (!user)
    return NextResponse.json(
      { message: "Sign in to delete this reminder." },
      { status: 401 },
    );
  try {
    await deleteReminder(user.id, reminderId, repository);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = knownError(error);
    if (response) return response;
    Sentry.captureMessage("Reminder deletion failed unexpectedly.", {
      level: "error",
      tags: { operation: "reminder_delete" },
    });
    return NextResponse.json(
      { message: "We could not delete this reminder. Try again." },
      { status: 500 },
    );
  }
}
