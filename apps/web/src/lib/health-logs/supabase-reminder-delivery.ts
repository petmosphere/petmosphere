import type { HealthLogReminderDeliveryRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

type DueRow = {
  local_date: string;
  owner_id: string;
  pet_id: string;
};

type SubscriptionRow = {
  auth: string;
  endpoint: string;
  id: string;
  p256dh: string;
};

export function createHealthLogReminderDeliveryRepository(
  supabase: SupabaseClient,
): HealthLogReminderDeliveryRepository {
  return {
    async claimDue(limit, now) {
      const { data, error } = await supabase.rpc(
        "claim_due_health_log_reminders",
        { p_limit: limit, p_now: now.toISOString() },
      );
      if (error) throw error;
      return ((data ?? []) as DueRow[]).map((row) => ({
        localDate: row.local_date,
        ownerId: row.owner_id,
        petId: row.pet_id,
      }));
    },
    async listSubscriptions(ownerId) {
      const { data, error } = await supabase
        .from("web_push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("owner_id", ownerId);
      if (error) throw error;
      return (data ?? []) as SubscriptionRow[];
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
