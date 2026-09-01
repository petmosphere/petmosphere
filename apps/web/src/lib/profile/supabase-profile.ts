import * as Sentry from "@sentry/nextjs";
import type {
  ProfilePhotoStorage,
  ProfileRepository,
} from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  avatarPath: string | null;
  displayName: string;
  isSubscribed: boolean;
  reminderNotificationsEnabled: boolean;
  weightUnit: "kg" | "lb";
};

type ProfileRow = {
  avatar_path: string | null;
  display_name: string | null;
  is_subscribed: boolean;
  reminder_notifications_enabled: boolean;
  weight_unit: "kg" | "lb";
};

function toProfile(row: ProfileRow): Profile {
  return {
    avatarPath: row.avatar_path,
    displayName: row.display_name ?? "Pet parent",
    isSubscribed: row.is_subscribed,
    reminderNotificationsEnabled: row.reminder_notifications_enabled,
    weightUnit: row.weight_unit,
  };
}

const columns =
  "display_name, avatar_path, weight_unit, reminder_notifications_enabled, is_subscribed";

export async function getProfile(supabase: SupabaseClient, ownerId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(columns)
    .eq("id", ownerId)
    .single();
  if (error) throw error;
  return toProfile(data as ProfileRow);
}

export function createProfileRepository(
  supabase: SupabaseClient,
): ProfileRepository {
  return {
    async find(ownerId) {
      const profile = await getProfile(supabase, ownerId);
      return {
        avatarPath: profile.avatarPath,
        displayName: profile.displayName,
      };
    },
    async update(ownerId, details) {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          avatar_path: details.avatarPath,
          display_name: details.displayName,
        })
        .eq("id", ownerId)
        .select("display_name, avatar_path")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        avatarPath: data.avatar_path as string | null,
        displayName: data.display_name as string,
      };
    },
  };
}

export function createProfilePhotoStorage(
  supabase: SupabaseClient,
): ProfilePhotoStorage {
  return {
    async remove(path) {
      const { error } = await supabase.storage
        .from("profile-avatars")
        .remove([path]);
      if (error) {
        Sentry.captureException(error, {
          tags: { operation: "profile_avatar_remove" },
        });
        throw error;
      }
    },
    async upload(ownerId, photo) {
      const path = `${ownerId}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("profile-avatars")
        .upload(path, photo.bytes, {
          contentType: photo.contentType,
          upsert: false,
        });
      if (error) throw error;
      return path;
    },
  };
}

export async function getProfileAvatarUrl(
  supabase: SupabaseClient,
  avatarPath: string | null,
) {
  if (!avatarPath) return null;
  const { data, error } = await supabase.storage
    .from("profile-avatars")
    .createSignedUrl(avatarPath, 60 * 60);
  if (!error) return data.signedUrl;

  Sentry.captureException(error, {
    tags: { operation: "profile_avatar_signed_url" },
  });
  return null;
}

export async function updateProfileUnits(
  supabase: SupabaseClient,
  ownerId: string,
  units: { weightUnit: "kg" | "lb" },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ weight_unit: units.weightUnit })
    .eq("id", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function updateSubscription(
  supabase: SupabaseClient,
  ownerId: string,
  subscription: { isSubscribed: boolean },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_subscribed: subscription.isSubscribed })
    .eq("id", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function updateReminderNotificationPreferences(
  supabase: SupabaseClient,
  ownerId: string,
  preferences: { enabled: boolean },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ reminder_notifications_enabled: preferences.enabled })
    .eq("id", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
