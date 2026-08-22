import type { Pet } from "@petmosphere/domain";

import type { PetPhoto, PetPhotoStorage } from "./create-pet";

export type UpdatePetDetails = Pick<
  Pet,
  | "approximateAge"
  | "birthDate"
  | "breed"
  | "desexedStatus"
  | "name"
  | "sex"
  | "species"
  | "weightKg"
>;

export type UpdatePetRepository = {
  findOwned(ownerId: string, petId: string): Promise<Pet | null>;
  update(
    ownerId: string,
    petId: string,
    details: UpdatePetDetails & { photoPath: string | null },
  ): Promise<Pet | null>;
};

export async function updatePet(
  ownerId: string,
  petId: string,
  input: UpdatePetDetails & { photo?: PetPhoto },
  repository: UpdatePetRepository,
  photoStorage: PetPhotoStorage,
) {
  const existingPet = await repository.findOwned(ownerId, petId);
  if (!existingPet) return null;

  let photoPath = existingPet.photoPath;
  if (input.photo) {
    photoPath = await photoStorage.upload({
      ownerId,
      petId,
      photo: input.photo,
    });
  }

  try {
    const pet = await repository.update(ownerId, petId, {
      approximateAge: input.approximateAge,
      birthDate: input.birthDate,
      breed: input.breed,
      desexedStatus: input.desexedStatus,
      name: input.name,
      photoPath,
      sex: input.sex,
      species: input.species,
      weightKg: input.weightKg,
    });

    if (!pet && input.photo && photoPath) {
      await photoStorage.remove(photoPath).catch(() => undefined);
      return null;
    }
    if (input.photo && existingPet.photoPath && pet) {
      await photoStorage.remove(existingPet.photoPath).catch(() => undefined);
    }
    return pet;
  } catch (error) {
    if (input.photo && photoPath) {
      await photoStorage.remove(photoPath).catch(() => undefined);
    }
    throw error;
  }
}
