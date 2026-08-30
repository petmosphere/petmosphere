import type { AppNotification, NotificationKind } from "@petmosphere/domain";
import type { NotificationRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

const columns =
  "id, owner_id, pet_id, reminder_id, kind, title, message, local_date, read_at, created_at";

type NotificationRow = {
  created_at: string;
  id: string;
  kind: NotificationKind;
  local_date: string | null;
  message: string;
  owner_id: string;
  pet_id: string | null;
  read_at: string | null;
  reminder_id: string | null;
  title: string;
};

function toNotification(row: NotificationRow): AppNotification {
  return {
    createdAt: row.created_at,
    id: row.id,
    kind: row.kind,
    localDate: row.local_date,
    message: row.message,
    ownerId: row.owner_id,
    petId: row.pet_id,
    readAt: row.read_at,
    reminderId: row.reminder_id,
    title: row.title,
  };
}

export function createNotificationRepository(
  supabase: SupabaseClient,
): NotificationRepository {
  return {
    async countUnread(ownerId, visibleAfter) {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", ownerId)
        .is("read_at", null)
        .gte("created_at", visibleAfter.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    async list(ownerId, visibleAfter) {
      const { data, error } = await supabase
        .from("notifications")
        .select(columns)
        .eq("owner_id", ownerId)
        .gte("created_at", visibleAfter.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return ((data ?? []) as NotificationRow[]).map(toNotification);
    },
    async markAllRead(ownerId, readAt) {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: readAt.toISOString() })
        .eq("owner_id", ownerId)
        .is("read_at", null);
      if (error) throw error;
    },
    async markRead(ownerId, notificationId, readAt) {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: readAt.toISOString() })
        .eq("owner_id", ownerId)
        .eq("id", notificationId)
        .is("read_at", null);
      if (error) throw error;
    },
  };
}

export function toNotificationResponse(notification: AppNotification) {
  return {
    createdAt: notification.createdAt,
    id: notification.id,
    kind: notification.kind,
    localDate: notification.localDate,
    message: notification.message,
    petId: notification.petId,
    readAt: notification.readAt,
    reminderId: notification.reminderId,
    title: notification.title,
  };
}
