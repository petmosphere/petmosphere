import type { AccountDeletionRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

async function removeFiles(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

export function createAccountDeletionRepository(
  supabase: SupabaseClient,
): AccountDeletionRepository {
  return {
    async deletePrivateFiles(ownerId) {
      const [profileResult, petsResult, logsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("avatar_path")
          .eq("id", ownerId)
          .maybeSingle(),
        supabase.from("pets").select("photo_path").eq("owner_id", ownerId),
        supabase
          .from("health_logs")
          .select("image_paths")
          .eq("owner_id", ownerId),
      ]);
      const error =
        profileResult.error ?? petsResult.error ?? logsResult.error ?? null;
      if (error) throw error;

      await Promise.all([
        removeFiles(
          supabase,
          "profile-avatars",
          profileResult.data?.avatar_path
            ? [profileResult.data.avatar_path as string]
            : [],
        ),
        removeFiles(
          supabase,
          "pet-photos",
          (petsResult.data ?? [])
            .map(({ photo_path }) => photo_path as string | null)
            .filter((path): path is string => Boolean(path)),
        ),
        removeFiles(
          supabase,
          "health-log-images",
          (logsResult.data ?? []).flatMap(
            ({ image_paths }) => image_paths as string[],
          ),
        ),
      ]);
    },
    async deleteAuthUser(ownerId) {
      const { error } = await createAdminClient().auth.admin.deleteUser(
        ownerId,
        false,
      );
      if (error) throw error;
    },
  };
}
