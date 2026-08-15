import {
  deriveLocalDate,
  maxHealthLogImages,
  type HealthLog,
  type HealthLogObservation,
  type HealthLogStatus,
  type NewHealthLog,
} from "@petmosphere/domain";

export class HealthLogConflictError extends Error {}
export class HealthLogImageLimitError extends Error {}
export class PetMembershipError extends Error {}
export class FutureHealthLogDateError extends Error {}

export type HealthLogImage = {
  bytes: Uint8Array;
  contentType: "image/webp";
};

export type HealthLogRepository = {
  create(
    log: NewHealthLog,
  ): Promise<{ created: boolean; healthLog: HealthLog }>;
  findById(ownerId: string, healthLogId: string): Promise<HealthLog | null>;
  findByPetAndDate(
    ownerId: string,
    petId: string,
    localDate: string,
  ): Promise<HealthLog | null>;
  findByRequest(ownerId: string, requestId: string): Promise<HealthLog | null>;
  listByMonth(
    ownerId: string,
    petId: string,
    month: string,
  ): Promise<HealthLog[]>;
  ownerHasPet(ownerId: string, petId: string): Promise<boolean>;
  delete(ownerId: string, healthLogId: string): Promise<HealthLog>;
  update(input: {
    healthLogId: string;
    imagePaths: string[];
    localDate: string;
    note: string | null;
    observations: HealthLogObservation[];
    ownerId: string;
    status: HealthLogStatus;
  }): Promise<HealthLog>;
};

export type HealthLogImageStorage = {
  remove(paths: string[]): Promise<void>;
  upload(input: {
    healthLogId: string;
    image: HealthLogImage;
    imageId: string;
    ownerId: string;
    petId: string;
  }): Promise<string>;
};

async function uploadImages(
  images: HealthLogImage[],
  input: { healthLogId: string; ownerId: string; petId: string },
  storage: HealthLogImageStorage,
) {
  const uploadedPaths: string[] = [];
  try {
    for (const image of images) {
      uploadedPaths.push(
        await storage.upload({
          ...input,
          image,
          imageId: crypto.randomUUID(),
        }),
      );
    }
    return uploadedPaths;
  } catch (error) {
    await storage.remove(uploadedPaths).catch(() => undefined);
    throw error;
  }
}

export async function createHealthLog(
  ownerId: string,
  input: {
    creationRequestId: string;
    images: HealthLogImage[];
    note: string | null;
    localDate: string;
    observations: HealthLogObservation[];
    petId: string;
    status: HealthLogStatus;
    timezone: string;
  },
  repository: HealthLogRepository,
  storage: HealthLogImageStorage,
  now = new Date(),
) {
  if (!(await repository.ownerHasPet(ownerId, input.petId))) {
    throw new PetMembershipError("Pet not found.");
  }

  const retry = await repository.findByRequest(
    ownerId,
    input.creationRequestId,
  );
  if (retry) return { created: false, healthLog: retry };

  const localDate = input.localDate;
  if (localDate > deriveLocalDate(now, input.timezone)) {
    throw new FutureHealthLogDateError("Health logs cannot be dated in the future.");
  }
  if (await repository.findByPetAndDate(ownerId, input.petId, localDate)) {
    throw new HealthLogConflictError("A health log already exists for this date.");
  }

  const healthLogId = crypto.randomUUID();
  const imagePaths = await uploadImages(
    input.images,
    { healthLogId, ownerId, petId: input.petId },
    storage,
  );

  try {
    const result = await repository.create({
      creationRequestId: input.creationRequestId,
      derivationTimezone: input.timezone,
      id: healthLogId,
      imagePaths,
      localDate,
      note: input.note,
      observations: input.observations,
      ownerId,
      petId: input.petId,
      source: "web",
      status: input.status,
    });
    if (!result.created) {
      await storage.remove(imagePaths).catch(() => undefined);
    }
    return result;
  } catch (error) {
    await storage.remove(imagePaths).catch(() => undefined);
    throw error;
  }
}

export async function updateHealthLog(
  ownerId: string,
  input: {
    healthLogId: string;
    images: HealthLogImage[];
    localDate: string;
    note: string | null;
    observations: HealthLogObservation[];
    petId: string;
    status: HealthLogStatus;
    timezone: string;
    retainedImageIndexes: number[];
  },
  repository: HealthLogRepository,
  storage: HealthLogImageStorage,
  now = new Date(),
) {
  if (!(await repository.ownerHasPet(ownerId, input.petId))) {
    throw new PetMembershipError("Pet not found.");
  }
  const existing = await repository.findById(ownerId, input.healthLogId);
  if (!existing || existing.petId !== input.petId) {
    throw new PetMembershipError("Health log not found.");
  }
  if (input.localDate > deriveLocalDate(now, input.timezone)) {
    throw new FutureHealthLogDateError("Health logs cannot be dated in the future.");
  }
  const retainedPaths = input.retainedImageIndexes.map(
    (index) => existing.imagePaths[index],
  );
  if (retainedPaths.some((path) => !path)) {
    throw new HealthLogImageLimitError("Reload the health log before changing photos.");
  }
  if (new Set(retainedPaths).size !== retainedPaths.length) {
    throw new HealthLogImageLimitError("Each retained photo can be selected once.");
  }
  if (retainedPaths.length + input.images.length > maxHealthLogImages) {
    throw new HealthLogImageLimitError(
      "Choose no more than four photos in total.",
    );
  }

  const newPaths = await uploadImages(
    input.images,
    {
      healthLogId: existing.id,
      ownerId,
      petId: existing.petId,
    },
    storage,
  );

  try {
    const updated = await repository.update({
      healthLogId: existing.id,
      imagePaths: [...retainedPaths, ...newPaths] as string[],
      localDate: input.localDate,
      note: input.note,
      observations: input.observations,
      ownerId,
      status: input.status,
    });
    const removedPaths = existing.imagePaths.filter(
      (path) => !retainedPaths.includes(path),
    );
    await storage.remove(removedPaths).catch(() => undefined);
    return updated;
  } catch (error) {
    await storage.remove(newPaths).catch(() => undefined);
    throw error;
  }
}

export async function deleteHealthLog(
  ownerId: string,
  petId: string,
  healthLogId: string,
  repository: HealthLogRepository,
  storage: HealthLogImageStorage,
) {
  if (!(await repository.ownerHasPet(ownerId, petId))) {
    throw new PetMembershipError("Pet not found.");
  }
  const existing = await repository.findById(ownerId, healthLogId);
  if (!existing || existing.petId !== petId) {
    throw new PetMembershipError("Health log not found.");
  }
  const deleted = await repository.delete(ownerId, healthLogId);
  await storage.remove(deleted.imagePaths).catch(() => undefined);
  return deleted;
}
