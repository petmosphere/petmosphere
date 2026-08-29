export type ProfileDetails = {
  avatarPath: string | null;
  displayName: string;
};

export type ProfileRepository = {
  find(ownerId: string): Promise<ProfileDetails | null>;
  update(
    ownerId: string,
    details: ProfileDetails,
  ): Promise<ProfileDetails | null>;
};

export type ProfilePhoto = {
  bytes: Uint8Array;
  contentType: "image/webp";
};

export type ProfilePhotoStorage = {
  remove(path: string): Promise<void>;
  upload(ownerId: string, photo: ProfilePhoto): Promise<string>;
};

export async function updateProfile(
  ownerId: string,
  displayName: string,
  photo: ProfilePhoto | undefined,
  repository: ProfileRepository,
  storage: ProfilePhotoStorage,
) {
  const existing = await repository.find(ownerId);
  if (!existing) return null;

  const avatarPath = photo
    ? await storage.upload(ownerId, photo)
    : existing.avatarPath;

  try {
    const profile = await repository.update(ownerId, {
      avatarPath,
      displayName,
    });
    if (!profile) {
      if (photo && avatarPath) {
        await storage.remove(avatarPath).catch(() => undefined);
      }
      return null;
    }
    if (photo && existing.avatarPath) {
      await storage.remove(existing.avatarPath).catch(() => undefined);
    }
    return profile;
  } catch (error) {
    if (photo && avatarPath) {
      await storage.remove(avatarPath).catch(() => undefined);
    }
    throw error;
  }
}
