import * as Sentry from "@sentry/nextjs";
import {
  healthLogQuerySchema,
  healthLogSummarySchema,
} from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import {
  createHealthLogRepository,
  getHealthLogResponse,
} from "@/lib/health-logs/supabase-health-logs";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json(
      { message: "Sign in to view health logs." },
      { status: 401 },
    );
  }

  try {
    const parsed = healthLogQuerySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Check the diary request." }, { status: 400 });
    }
    const repository = createHealthLogRepository(supabase);
    if (!(await repository.ownerHasPet(data.user.id, parsed.data.petId))) {
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    }
    if (parsed.data.scope === "date") {
      const healthLog = await repository.findByPetAndDate(
        data.user.id,
        parsed.data.petId,
        parsed.data.localDate,
      );
      return NextResponse.json(
        healthLog ? await getHealthLogResponse(supabase, healthLog) : null,
      );
    }
    const logs = await repository.listByMonth(
      data.user.id,
      parsed.data.petId,
      parsed.data.month,
    );
    return NextResponse.json(
      logs.map((healthLog) =>
        healthLogSummarySchema.parse({
          id: healthLog.id,
          localDate: healthLog.localDate,
          status: healthLog.status,
        }),
      ),
    );
  } catch {
    Sentry.captureMessage("Health diary query failed unexpectedly.", {
      level: "error",
      tags: { operation: "health_diary_query" },
    });
    return NextResponse.json(
      { message: "We could not load the health diary. Try again." },
      { status: 500 },
    );
  }
}
