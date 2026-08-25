import * as Sentry from "@sentry/nextjs";
import {
  weightReminderResponseSchema,
  weightReminderSchema,
} from "@petmosphere/api-contracts";
import {
  getWeightReminder,
  saveWeightReminder,
  WeightPetAccessError,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createWeightReminderRepository,
  createWeightRepository,
  toWeightReminderResponse,
} from "@/lib/weights/supabase-weights";

async function contextUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ petId: string }> },
) {
  const { supabase, user } = await contextUser();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to view reminders." },
      { status: 401 },
    );
  const { petId } = await context.params;
  try {
    const reminder = await getWeightReminder(
      user.id,
      petId,
      createWeightRepository(supabase),
      createWeightReminderRepository(supabase),
    );
    return NextResponse.json(
      reminder
        ? weightReminderResponseSchema.parse(toWeightReminderResponse(reminder))
        : null,
    );
  } catch (error) {
    if (error instanceof WeightPetAccessError)
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    Sentry.captureMessage("Weight reminder lookup failed unexpectedly.", {
      level: "error",
      tags: { operation: "weight_reminder_lookup" },
    });
    return NextResponse.json(
      { message: "We could not load the reminder." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ petId: string }> },
) {
  const { supabase, user } = await contextUser();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to save reminders." },
      { status: 401 },
    );
  const { petId } = await context.params;
  const parsed = weightReminderSchema.safeParse({
    ...(await request.json().catch(() => null)),
    petId,
  });
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the reminder." },
      { status: 400 },
    );
  try {
    const reminder = await saveWeightReminder(
      user.id,
      parsed.data,
      createWeightRepository(supabase),
      createWeightReminderRepository(supabase),
    );
    return NextResponse.json(
      weightReminderResponseSchema.parse(toWeightReminderResponse(reminder)),
    );
  } catch (error) {
    if (error instanceof WeightPetAccessError)
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    Sentry.captureMessage("Weight reminder save failed unexpectedly.", {
      level: "error",
      tags: { operation: "weight_reminder_save" },
    });
    return NextResponse.json(
      { message: "We could not save this reminder. Try again." },
      { status: 500 },
    );
  }
}
