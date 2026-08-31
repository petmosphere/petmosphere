import type {
  NewReminder,
  Reminder,
  ReminderCategory,
  ReminderRepeatRule,
} from "@petmosphere/domain";
import type { ReminderRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

const columns =
  "id, series_id, owner_id, pet_id, creation_request_id, category, title, due_local_date, local_time, timezone, repeat_rule, series_start_date, note, notification_lead_minutes, completed_at, notified_at, deleted_at, created_at, updated_at";

type ReminderRow = {
  category: ReminderCategory;
  completed_at: string | null;
  created_at: string;
  creation_request_id: string;
  deleted_at: string | null;
  due_local_date: string;
  id: string;
  local_time: string;
  note: string | null;
  notification_lead_minutes: number | null;
  notified_at: string | null;
  owner_id: string;
  pet_id: string;
  repeat_rule: ReminderRepeatRule;
  series_id: string;
  series_start_date: string;
  timezone: "Australia/Melbourne";
  title: string;
  updated_at: string;
};

export function toReminder(row: ReminderRow): Reminder {
  return {
    category: row.category,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    creationRequestId: row.creation_request_id,
    deletedAt: row.deleted_at,
    dueDate: row.due_local_date,
    id: row.id,
    localTime: row.local_time.slice(0, 5),
    note: row.note,
    notificationLeadMinutes:
      row.notification_lead_minutes as Reminder["notificationLeadMinutes"],
    notifiedAt: row.notified_at,
    ownerId: row.owner_id,
    petId: row.pet_id,
    repeatRule: row.repeat_rule,
    seriesId: row.series_id,
    seriesStartDate: row.series_start_date,
    timezone: row.timezone,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

async function findOne(
  query: PromiseLike<{ data: unknown; error: unknown | null }>,
) {
  const { data, error } = await query;
  if (error) throw error;
  return data ? toReminder(data as ReminderRow) : null;
}

export function createReminderRepository(
  supabase: SupabaseClient,
): ReminderRepository {
  const findByRequest = (ownerId: string, requestId: string) =>
    findOne(
      supabase
        .from("reminders")
        .select(columns)
        .eq("owner_id", ownerId)
        .eq("creation_request_id", requestId)
        .maybeSingle(),
    );

  return {
    async complete(ownerId, reminderId, nextDueDate) {
      const { data, error } = await supabase.rpc("complete_reminder", {
        p_next_due_date: nextDueDate,
        p_reminder_id: reminderId,
      });
      if (error) throw error;
      const ids = (
        data as { completed_id: string; next_id: string | null }[]
      )[0];
      if (!ids) throw new Error("Reminder completion returned no data.");
      const completed = await findOne(
        supabase
          .from("reminders")
          .select(columns)
          .eq("owner_id", ownerId)
          .eq("id", ids.completed_id)
          .single(),
      );
      const next = ids.next_id
        ? await findOne(
            supabase
              .from("reminders")
              .select(columns)
              .eq("owner_id", ownerId)
              .eq("id", ids.next_id)
              .single(),
          )
        : null;
      if (!completed) throw new Error("Completed reminder was not found.");
      return { completed, next };
    },
    async create(reminder: NewReminder) {
      const { data, error } = await supabase
        .from("reminders")
        .insert({
          category: reminder.category,
          creation_request_id: reminder.creationRequestId,
          due_local_date: reminder.dueDate,
          id: reminder.id,
          local_time: reminder.localTime,
          note: reminder.note,
          notification_lead_minutes: reminder.notificationLeadMinutes,
          owner_id: reminder.ownerId,
          pet_id: reminder.petId,
          repeat_rule: reminder.repeatRule,
          series_id: reminder.seriesId,
          series_start_date: reminder.seriesStartDate,
          timezone: reminder.timezone,
          title: reminder.title,
        })
        .select(columns)
        .single();
      if (!error && data)
        return { created: true, reminder: toReminder(data as ReminderRow) };
      if (error?.code === "23505") {
        const retry = await findByRequest(
          reminder.ownerId,
          reminder.creationRequestId,
        );
        if (retry) return { created: false, reminder: retry };
      }
      throw error ?? new Error("Reminder creation returned no data.");
    },
    findById: (ownerId, reminderId) =>
      findOne(
        supabase
          .from("reminders")
          .select(columns)
          .eq("owner_id", ownerId)
          .eq("id", reminderId)
          .maybeSingle(),
      ),
    findByRequest,
    async list(ownerId, status, localDate, localTime) {
      let query = supabase
        .from("reminders")
        .select(columns)
        .eq("owner_id", ownerId)
        .is("deleted_at", null);
      if (status === "completed") {
        query = query
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false });
      } else {
        query = query.is("completed_at", null);
        query =
          status === "overdue"
            ? query.or(
                `due_local_date.lt.${localDate},and(due_local_date.eq.${localDate},local_time.lt.${localTime})`,
              )
            : query.or(
                `due_local_date.gt.${localDate},and(due_local_date.eq.${localDate},local_time.gte.${localTime})`,
              );
        query = query.order("due_local_date").order("local_time");
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as ReminderRow[]).map(toReminder);
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
    async softDelete(ownerId, reminderId) {
      const { data, error } = await supabase
        .from("reminders")
        .update({ deleted_at: new Date().toISOString() })
        .eq("owner_id", ownerId)
        .eq("id", reminderId)
        .is("completed_at", null)
        .is("deleted_at", null)
        .select(columns)
        .single();
      if (error) throw error;
      return toReminder(data as ReminderRow);
    },
    async update(input) {
      const { data, error } = await supabase
        .from("reminders")
        .update({
          category: input.category,
          due_local_date: input.dueDate,
          local_time: input.localTime,
          note: input.note,
          notification_lead_minutes: input.notificationLeadMinutes,
          notified_at: null,
          pet_id: input.petId,
          repeat_rule: input.repeatRule,
          series_start_date: input.dueDate,
          title: input.title,
        })
        .eq("owner_id", input.ownerId)
        .eq("id", input.reminderId)
        .is("completed_at", null)
        .is("deleted_at", null)
        .select(columns)
        .single();
      if (error) throw error;
      return toReminder(data as ReminderRow);
    },
  };
}

export function toReminderResponse(reminder: Reminder) {
  return {
    category: reminder.category,
    completedAt: reminder.completedAt,
    createdAt: reminder.createdAt,
    dueDate: reminder.dueDate,
    id: reminder.id,
    localTime: reminder.localTime,
    note: reminder.note,
    notificationLeadMinutes: reminder.notificationLeadMinutes,
    petId: reminder.petId,
    repeatRule: reminder.repeatRule,
    seriesId: reminder.seriesId,
    timezone: reminder.timezone,
    title: reminder.title,
    updatedAt: reminder.updatedAt,
  };
}
