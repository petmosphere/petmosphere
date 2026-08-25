import * as Sentry from "@sentry/nextjs";
import {
  saveWeightSchema,
  weightEntryResponseSchema,
} from "@petmosphere/api-contracts";
import {
  listWeights,
  saveWeight,
  WeightPetAccessError,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createWeightRepository,
  toWeightEntryResponse,
} from "@/lib/weights/supabase-weights";
import { createClient } from "@/lib/supabase/server";

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
      { message: "Sign in to view weights." },
      { status: 401 },
    );
  const { petId } = await context.params;
  try {
    const entries = await listWeights(
      user.id,
      petId,
      createWeightRepository(supabase),
    );
    return NextResponse.json(
      entries.map((entry) =>
        weightEntryResponseSchema.parse(toWeightEntryResponse(entry)),
      ),
    );
  } catch (error) {
    if (error instanceof WeightPetAccessError)
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    Sentry.captureMessage("Weight history lookup failed unexpectedly.", {
      level: "error",
      tags: { operation: "weight_history_lookup" },
    });
    return NextResponse.json(
      { message: "We could not load weight history." },
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
      { message: "Sign in to log weight." },
      { status: 401 },
    );
  const { petId } = await context.params;
  const parsed = saveWeightSchema.safeParse({
    ...(await request.json().catch(() => null)),
    petId,
  });
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the weight." },
      { status: 400 },
    );
  try {
    const entry = await saveWeight(
      user.id,
      parsed.data,
      createWeightRepository(supabase),
    );
    return NextResponse.json(
      weightEntryResponseSchema.parse(toWeightEntryResponse(entry)),
    );
  } catch (error) {
    if (error instanceof WeightPetAccessError)
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    Sentry.captureMessage("Weight save failed unexpectedly.", {
      level: "error",
      tags: { operation: "weight_save" },
    });
    return NextResponse.json(
      { message: "We could not save this weight. Try again." },
      { status: 500 },
    );
  }
}
