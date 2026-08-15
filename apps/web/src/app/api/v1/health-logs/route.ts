import * as Sentry from "@sentry/nextjs";
import {
  createHealthLogSchema,
  deleteHealthLogSchema,
  MAX_HEALTH_LOG_IMAGES,
  updateHealthLogSchema,
} from "@petmosphere/api-contracts";
import {
  createHealthLog,
  deleteHealthLog,
  FutureHealthLogDateError,
  HealthLogConflictError,
  HealthLogImageLimitError,
  PetMembershipError,
  updateHealthLog,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  InvalidHealthLogImageError,
  prepareHealthLogImage,
} from "@/lib/health-logs/image";
import {
  createHealthLogImageStorage,
  createHealthLogRepository,
  getHealthLogResponse,
} from "@/lib/health-logs/supabase-health-logs";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  const fields: Record<string, unknown> = Object.fromEntries(
    [
      "creationRequestId",
      "healthLogId",
      "localDate",
      "note",
      "observations",
      "petId",
      "retainedImageIndexes",
      "status",
      "timezone",
    ].map((key) => [key, formData.get(key)?.toString() ?? ""]),
  );
  for (const key of ["observations", "retainedImageIndexes"] as const) {
    try {
      fields[key] = JSON.parse(String(fields[key] || "[]")) as unknown;
    } catch {
      fields[key] = "";
    }
  }
  return fields;
}

async function requireApiUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

async function prepareImages(formData: FormData) {
  const entries = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (entries.length > MAX_HEALTH_LOG_IMAGES) {
    throw new HealthLogImageLimitError("Choose no more than four photos.");
  }
  return Promise.all(entries.map(prepareHealthLogImage));
}

function knownError(error: unknown) {
  if (error instanceof HealthLogConflictError) {
    return NextResponse.json(
      {
        code: "HEALTH_LOG_CONFLICT",
        message:
          "A health log for this date already exists. Open it to continue.",
      },
      { status: 409 },
    );
  }
  if (error instanceof FutureHealthLogDateError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (error instanceof PetMembershipError) {
    return NextResponse.json({ message: "Pet not found." }, { status: 404 });
  }
  if (error instanceof HealthLogImageLimitError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (error instanceof InvalidHealthLogImageError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  return null;
}

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json(
      { message: "Sign in to save a health log." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const parsed = createHealthLogSchema.safeParse(readFields(formData));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Check the health log details.",
        },
        { status: 400 },
      );
    }
    const result = await createHealthLog(
      user.id,
      {
        creationRequestId: parsed.data.creationRequestId,
        images: await prepareImages(formData),
        localDate: parsed.data.localDate,
        note: parsed.data.note ?? null,
        observations: parsed.data.observations,
        petId: parsed.data.petId,
        status: parsed.data.status,
        timezone: parsed.data.timezone,
      },
      createHealthLogRepository(supabase),
      createHealthLogImageStorage(supabase),
    );
    return NextResponse.json(
      await getHealthLogResponse(supabase, result.healthLog),
      {
        status: result.created ? 201 : 200,
      },
    );
  } catch (error) {
    const response = knownError(error);
    if (response) return response;
    Sentry.captureMessage("Health log save failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_log_create" },
    });
    return NextResponse.json(
      { message: "We could not save this health log. Try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json(
      { message: "Sign in to update a health log." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const parsed = updateHealthLogSchema.safeParse(readFields(formData));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Check the health log details.",
        },
        { status: 400 },
      );
    }
    const healthLog = await updateHealthLog(
      user.id,
      {
        healthLogId: parsed.data.healthLogId,
        images: await prepareImages(formData),
        localDate: parsed.data.localDate,
        note: parsed.data.note ?? null,
        observations: parsed.data.observations,
        petId: parsed.data.petId,
        retainedImageIndexes: parsed.data.retainedImageIndexes,
        status: parsed.data.status,
        timezone: parsed.data.timezone,
      },
      createHealthLogRepository(supabase),
      createHealthLogImageStorage(supabase),
    );
    return NextResponse.json(await getHealthLogResponse(supabase, healthLog));
  } catch (error) {
    const response = knownError(error);
    if (response) return response;
    Sentry.captureMessage("Health log update failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_log_update" },
    });
    return NextResponse.json(
      { message: "We could not update this health log. Try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json(
      { message: "Sign in to delete a health log." },
      { status: 401 },
    );
  }

  try {
    const parsed = deleteHealthLogSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Check the health log details." },
        { status: 400 },
      );
    }
    await deleteHealthLog(
      user.id,
      parsed.data.petId,
      parsed.data.healthLogId,
      createHealthLogRepository(supabase),
      createHealthLogImageStorage(supabase),
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = knownError(error);
    if (response) return response;
    Sentry.captureMessage("Health log deletion failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_log_delete" },
    });
    return NextResponse.json(
      { message: "We could not delete this health log. Try again." },
      { status: 500 },
    );
  }
}
