import type { Pet } from "@petmosphere/domain";

import type { PetPhotoStorage } from "./create-pet";

export type DeletePetRepository = {
  delete(ownerId: string, petId: string): Promise<Pet | null>;
  findOwned(ownerId: string, petId: string): Promise<Pet | null>;
  listHealthLogImagePaths(ownerId: string, petId: string): Promise<string[]>;
};

export type PetHealthLogImageStorage = {
  remove(paths: string[]): Promise<void>;
};

export async function deletePet(
  ownerId: string,
  petId: string,
  repository: DeletePetRepository,
  petPhotoStorage: PetPhotoStorage,
  healthLogImageStorage: PetHealthLogImageStorage,
) {
  const pet = await repository.findOwned(ownerId, petId);
  if (!pet) return { cleanupFailed: false, deleted: false };

  const healthLogImagePaths = await repository.listHealthLogImagePaths(
    ownerId,
    petId,
  );
  const deletedPet = await repository.delete(ownerId, petId);
  if (!deletedPet) return { cleanupFailed: false, deleted: false };

  const cleanup = await Promise.allSettled([
    pet.photoPath ? petPhotoStorage.remove(pet.photoPath) : Promise.resolve(),
    healthLogImageStorage.remove(healthLogImagePaths),
  ]);

  return {
    cleanupFailed: cleanup.some(({ status }) => status === "rejected"),
    deleted: true,
  };
}
