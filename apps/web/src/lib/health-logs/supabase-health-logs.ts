import * as Sentry from "@sentry/nextjs";
import { healthLogResponseSchema } from "@petmosphere/api-contracts";
import type {
  HealthLog,
  HealthLogObservation,
  HealthLogStatus,
  NewHealthLog,
} from "@petmosphere/domain";
import {
  HealthLogConflictError,
  type HealthLogImageStorage,
  type HealthLogRepository,
} from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

const healthLogColumns =
  "id, owner_id, pet_id, local_date, derivation_timezone, status, observations, note, image_paths, source, created_at, updated_at";

type HealthLogRow = {
  created_at: string;
  derivation_timezone: string;
  id: string;
  image_paths: string[];
  local_date: string;
  note: string | null;
  observations: HealthLogObservation[];
  owner_id: string;
  pet_id: string;
  source: "web";
  status: HealthLogStatus;
  updated_at: string;
};

export type HomeHealthLogSummary = Pick<
  HealthLog,
  "id" | "localDate" | "observations" | "status"
>;

type HomeHealthLogRow = {
  id: string;
  local_date: string;
  observations: HealthLogObservation[];
  status: HealthLogStatus;
};

function toHealthLog(row: HealthLogRow): HealthLog {
  return {
    createdAt: row.created_at,
    derivationTimezone: row.derivation_timezone,
    id: row.id,
    imagePaths: row.image_paths,
    localDate: row.local_date,
    note: row.note,
    observations: row.observations,
    ownerId: row.owner_id,
    petId: row.pet_id,
    source: row.source,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function listOwnedHealthLogSummaries(
  supabase: SupabaseClient,
  ownerId: string,
  petId: string,
  startDate: string,
  endDate: string,
): Promise<HomeHealthLogSummary[]> {
  const { data, error } = await supabase
    .from("health_logs")
    .select("id, local_date, observations, status")
    .eq("owner_id", ownerId)
    .eq("pet_id", petId)
    .gte("local_date", startDate)
    .lte("local_date", endDate)
    .order("local_date", { ascending: false });
  if (error) throw error;
  return (data as HomeHealthLogRow[]).map((row) => ({
    id: row.id,
    localDate: row.local_date,
    observations: row.observations,
    status: row.status,
  }));
}

async function findOne(
  query: PromiseLike<{ data: unknown; error: unknown | null }>,
) {
  const { data, error } = await query;
  if (error) throw error;
  return data ? toHealthLog(data as HealthLogRow) : null;
}

export function createHealthLogRepository(
  supabase: SupabaseClient,
): HealthLogRepository {
  const findByRequest = (ownerId: string, requestId: string) =>
    findOne(
      supabase
        .from("health_logs")
        .select(healthLogColumns)
        .eq("owner_id", ownerId)
        .eq("creation_request_id", requestId)
        .maybeSingle(),
    );

  return {
    async create(log: NewHealthLog) {
      const { data, error } = await supabase
        .from("health_logs")
        .insert({
          creation_request_id: log.creationRequestId,
          derivation_timezone: log.derivationTimezone,
          id: log.id,
          image_paths: log.imagePaths,
          local_date: log.localDate,
          note: log.note,
          observations: log.observations,
          owner_id: log.ownerId,
          pet_id: log.petId,
          source: log.source,
          status: log.status,
        })
        .select(healthLogColumns)
        .single();

      if (!error && data) {
        return {
          created: true,
          healthLog: toHealthLog(data as HealthLogRow),
        };
      }
      if (error?.code === "23505") {
        const retry = await findByRequest(log.ownerId, log.creationRequestId);
        if (retry) return { created: false, healthLog: retry };
        throw new HealthLogConflictError(
          "A health log already exists for this date.",
        );
      }
      throw error ?? new Error("Health log creation returned no data.");
    },
    findById: (ownerId, healthLogId) =>
      findOne(
        supabase
          .from("health_logs")
          .select(healthLogColumns)
          .eq("owner_id", ownerId)
          .eq("id", healthLogId)
          .maybeSingle(),
      ),
    findByPetAndDate: (ownerId, petId, localDate) =>
      findOne(
        supabase
          .from("health_logs")
          .select(healthLogColumns)
          .eq("owner_id", ownerId)
          .eq("pet_id", petId)
          .eq("local_date", localDate)
          .maybeSingle(),
      ),
    findByRequest,
    async listByMonth(ownerId, petId, month) {
      const start = `${month}-01`;
      const [year, monthNumber] = month.split("-").map(Number);
      const end = new Date(Date.UTC(year!, monthNumber!, 1))
        .toISOString()
        .slice(0, 10);
      const { data, error } = await supabase
        .from("health_logs")
        .select(healthLogColumns)
        .eq("owner_id", ownerId)
        .eq("pet_id", petId)
        .gte("local_date", start)
        .lt("local_date", end)
        .order("local_date");
      if (error) throw error;
      return (data as HealthLogRow[]).map(toHealthLog);
    },
    async ownerHasPet(ownerId, petId) {
      const { data, error } = await supabase
        .from("pets")
        .select("id")
        .eq("id", petId)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    async delete(ownerId, healthLogId) {
      const { data, error } = await supabase
        .from("health_logs")
        .delete()
        .eq("id", healthLogId)
        .eq("owner_id", ownerId)
        .select(healthLogColumns)
        .single();
      if (error) throw error;
      return toHealthLog(data as HealthLogRow);
    },
    async update(input) {
      const { data, error } = await supabase
        .from("health_logs")
        .update({
          image_paths: input.imagePaths,
          local_date: input.localDate,
          note: input.note,
          observations: input.observations,
          status: input.status,
        })
        .eq("id", input.healthLogId)
        .eq("owner_id", input.ownerId)
        .select(healthLogColumns)
        .single();
      if (error?.code === "23505") {
        throw new HealthLogConflictError(
          "A health log already exists for this date.",
        );
      }
      if (error) throw error;
      return toHealthLog(data as HealthLogRow);
    },
  };
}

export function createHealthLogImageStorage(
  supabase: SupabaseClient,
): HealthLogImageStorage {
  return {
    async remove(paths) {
      if (paths.length === 0) return;
      const { error } = await supabase.storage
        .from("health-log-images")
        .remove(paths);
      if (error) throw error;
    },
    async upload({ healthLogId, image, imageId, ownerId, petId }) {
      const path = `${ownerId}/${petId}/${healthLogId}/${imageId}.webp`;
      const { error } = await supabase.storage
        .from("health-log-images")
        .upload(path, image.bytes, {
          contentType: image.contentType,
          upsert: false,
        });
      if (error) throw error;
      return path;
    },
  };
}

export async function getHealthLogImageUrls(
  supabase: SupabaseClient,
  paths: string[],
) {
  const urls = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from("health-log-images")
        .createSignedUrl(path, 60 * 60);
      if (!error) return data.signedUrl;

      Sentry.captureMessage("Could not create a health log image URL.", {
        level: "error",
        tags: { operation: "health_log_image_signed_url" },
      });
      return null;
    }),
  );
  return urls.filter((url): url is string => Boolean(url));
}

export async function getHealthLogResponse(
  supabase: SupabaseClient,
  healthLog: HealthLog,
) {
  return healthLogResponseSchema.parse({
    createdAt: healthLog.createdAt,
    derivationTimezone: healthLog.derivationTimezone,
    id: healthLog.id,
    imageUrls: await getHealthLogImageUrls(supabase, healthLog.imagePaths),
    localDate: healthLog.localDate,
    note: healthLog.note,
    observations: healthLog.observations,
    petId: healthLog.petId,
    source: healthLog.source,
    status: healthLog.status,
    updatedAt: healthLog.updatedAt,
  });
}
