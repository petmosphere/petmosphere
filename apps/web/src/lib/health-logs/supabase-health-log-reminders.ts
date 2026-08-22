import type { HealthLogReminder } from "@petmosphere/domain";
import type { HealthLogReminderRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

type ReminderRow = {
  enabled: boolean;
  local_time: string;
  owner_id: string;
  pet_id: string;
  timezone: string;
  updated_at: string;
};

function toReminder(row: ReminderRow): HealthLogReminder {
  return {
    enabled: row.enabled,
    localTime: row.local_time.slice(0, 5),
    ownerId: row.owner_id,
    petId: row.pet_id,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  };
}

export function createHealthLogReminderRepository(
  supabase: SupabaseClient,
): HealthLogReminderRepository {
  return {
    async find(ownerId, petId) {
      const { data, error } = await supabase
        .from("health_log_reminders")
        .select("owner_id, pet_id, enabled, local_time, timezone, updated_at")
        .eq("owner_id", ownerId)
        .eq("pet_id", petId)
        .maybeSingle();
      if (error) throw error;
      return data ? toReminder(data as ReminderRow) : null;
    },
    async save(input) {
      const { data, error } = await supabase
        .from("health_log_reminders")
        .upsert(
          {
            enabled: input.enabled,
            local_time: input.localTime,
            owner_id: input.ownerId,
            pet_id: input.petId,
            timezone: input.timezone,
          },
          { onConflict: "owner_id,pet_id" },
        )
        .select("owner_id, pet_id, enabled, local_time, timezone, updated_at")
        .single();
      if (error) throw error;
      return toReminder(data as ReminderRow);
    },
  };
}
