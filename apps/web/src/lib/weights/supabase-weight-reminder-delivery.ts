import type { WeightReminderDeliveryRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createWeightReminderDeliveryRepository(
  supabase: SupabaseClient,
): WeightReminderDeliveryRepository {
  return {
    async claimDue(limit, now) {
      const { data, error } = await supabase.rpc(
        "claim_due_pet_weight_reminders",
        { p_limit: limit, p_now: now.toISOString() },
      );
      if (error) throw error;
      return ((data ?? []) as { owner_id: string; pet_id: string }[]).map(
        (row) => ({ ownerId: row.owner_id, petId: row.pet_id }),
      );
    },
    async listSubscriptions(ownerId) {
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
