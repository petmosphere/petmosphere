import type { ReminderDeliveryRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createReminderDeliveryRepository(
  supabase: SupabaseClient,
): ReminderDeliveryRepository {
  return {
    async claimDue(limit, now) {
      const { data, error } = await supabase.rpc("claim_due_reminders", {
        p_limit: limit,
        p_now: now.toISOString(),
      });
      if (error) throw error;
      return ((data ?? []) as { owner_id: string; reminder_id: string }[]).map(
        (row) => ({ id: row.reminder_id, ownerId: row.owner_id }),
      );
    },
    async createNextOccurrence(reminderId, nextDueDate) {
      const { error } = await supabase.rpc("create_next_reminder_occurrence", {
        p_next_due_date: nextDueDate,
        p_reminder_id: reminderId,
      });
      if (error) throw error;
    },
    async listOverdueRecurring(limit, now) {
      const { data, error } = await supabase.rpc(
        "list_overdue_recurring_reminders",
        { p_limit: limit, p_now: now.toISOString() },
      );
      if (error) throw error;
      return (
        (data ?? []) as {
          reminder_id: string;
          repeat_rule:
            "daily" | "weekly" | "fortnightly" | "monthly" | "yearly";
          series_start_date: string;
          timezone: "Australia/Melbourne";
        }[]
      ).map((row) => ({
        id: row.reminder_id,
        repeatRule: row.repeat_rule,
        seriesStartDate: row.series_start_date,
        timezone: row.timezone,
      }));
    },
    async listSubscriptions(ownerId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("reminder_notifications_enabled")
        .eq("id", ownerId)
        .single();
      if (profileError) throw profileError;
      if (!profile.reminder_notifications_enabled) return [];
      const { data, error } = await supabase
        .from("web_push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("owner_id", ownerId);
      if (error) throw error;
      return data ?? [];
    },
    async removeSubscription(id) {
      const { error } = await supabase
        .from("web_push_subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
  };
}
