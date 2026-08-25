import type { WeightEntry, WeightReminder } from "@petmosphere/domain";
import type {
  WeightReminderRepository,
  WeightRepository,
} from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

const entryColumns =
  "id, owner_id, pet_id, local_date, derivation_timezone, weight_kg, source, created_at, updated_at";

type WeightEntryRow = {
  created_at: string;
  derivation_timezone: WeightEntry["derivationTimezone"];
  id: string;
  local_date: string;
  owner_id: string;
  pet_id: string;
  source: WeightEntry["source"];
  updated_at: string;
  weight_kg: number;
};

function toWeightEntry(row: WeightEntryRow): WeightEntry {
  return {
    createdAt: row.created_at,
    derivationTimezone: row.derivation_timezone,
    id: row.id,
    localDate: row.local_date,
    ownerId: row.owner_id,
    petId: row.pet_id,
    source: row.source,
    updatedAt: row.updated_at,
    weightKg: Number(row.weight_kg),
  };
}

export function createWeightRepository(
  supabase: SupabaseClient,
): WeightRepository {
  return {
    async list(ownerId, petId, fromLocalDate) {
      const { data, error } = await supabase
        .from("pet_weight_entries")
        .select(entryColumns)
        .eq("owner_id", ownerId)
        .eq("pet_id", petId)
        .gte("local_date", fromLocalDate)
        .order("local_date");
      if (error) throw error;
      return (data as WeightEntryRow[]).map(toWeightEntry);
    },
    async ownerHasPet(ownerId, petId) {
      const { data, error } = await supabase
        .from("pets")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("id", petId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    async save(entry) {
      const { data, error } = await supabase
        .from("pet_weight_entries")
        .upsert(
          {
            derivation_timezone: entry.derivationTimezone,
            local_date: entry.localDate,
            owner_id: entry.ownerId,
            pet_id: entry.petId,
            source: entry.source,
            weight_kg: entry.weightKg,
          },
          { onConflict: "pet_id,local_date" },
        )
        .select(entryColumns)
        .single();
      if (error) throw error;
      return toWeightEntry(data as WeightEntryRow);
    },
  };
}

const reminderColumns =
  "owner_id, pet_id, enabled, frequency, schedule_day, local_time, timezone, updated_at";

type WeightReminderRow = {
  enabled: boolean;
  frequency: WeightReminder["frequency"];
  local_time: string;
  owner_id: string;
  pet_id: string;
  schedule_day: number;
  timezone: WeightReminder["timezone"];
  updated_at: string;
};

function toWeightReminder(row: WeightReminderRow): WeightReminder {
  return {
    enabled: row.enabled,
    frequency: row.frequency,
    localTime: row.local_time.slice(0, 5),
    ownerId: row.owner_id,
    petId: row.pet_id,
    scheduleDay: row.schedule_day,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  };
}

export function createWeightReminderRepository(
  supabase: SupabaseClient,
): WeightReminderRepository {
  return {
    async find(ownerId, petId) {
      const { data, error } = await supabase
        .from("pet_weight_reminders")
        .select(reminderColumns)
        .eq("owner_id", ownerId)
        .eq("pet_id", petId)
        .maybeSingle();
      if (error) throw error;
      return data ? toWeightReminder(data as WeightReminderRow) : null;
    },
    async save(input) {
      const { data, error } = await supabase
        .from("pet_weight_reminders")
        .upsert(
          {
            enabled: input.enabled,
            frequency: input.frequency,
            local_time: input.localTime,
            next_due_local_date: input.nextDueDate,
            owner_id: input.ownerId,
            pet_id: input.petId,
            schedule_day: input.scheduleDay,
            timezone: input.timezone,
          },
          { onConflict: "owner_id,pet_id" },
        )
        .select(reminderColumns)
        .single();
      if (error) throw error;
      return toWeightReminder(data as WeightReminderRow);
    },
  };
}

export function toWeightEntryResponse(entry: WeightEntry) {
  return {
    createdAt: entry.createdAt,
    derivationTimezone: entry.derivationTimezone,
    id: entry.id,
    localDate: entry.localDate,
    petId: entry.petId,
    source: entry.source,
    updatedAt: entry.updatedAt,
    weightKg: entry.weightKg,
  };
}

export function toWeightReminderResponse(reminder: WeightReminder) {
  return {
    enabled: reminder.enabled,
    frequency: reminder.frequency,
    localTime: reminder.localTime,
    petId: reminder.petId,
    scheduleDay: reminder.scheduleDay,
    timezone: reminder.timezone,
    updatedAt: reminder.updatedAt,
  };
}
