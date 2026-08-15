import type { NewPet, Pet } from "@petmosphere/domain";

export type PetPhoto = {
  bytes: Uint8Array;
  contentType: "image/webp";
};

export type PetRepository = {
  create(pet: NewPet): Promise<{ created: boolean; pet: Pet }>;
  findByCreationRequest(
    ownerId: string,
    requestId: string,
  ): Promise<Pet | null>;
};

export type PetPhotoStorage = {
  remove(path: string): Promise<void>;
  upload(input: {
    ownerId: string;
    petId: string;
    photo: PetPhoto;
  }): Promise<string>;
};

type CreatePetInput = Omit<NewPet, "id" | "ownerId" | "photoPath"> & {
  photo?: PetPhoto;
};

export async function createPet(
  ownerId: string,
  input: CreatePetInput,
  repository: PetRepository,
  photoStorage: PetPhotoStorage,
) {
  const existingPet = await repository.findByCreationRequest(
    ownerId,
    input.creationRequestId,
  );
  if (existingPet) return existingPet;

  const petId = crypto.randomUUID();
  let photoPath: string | null = null;

  if (input.photo) {
    photoPath = await photoStorage.upload({
      ownerId,
      petId,
      photo: input.photo,
    });
  }

  try {
    const result = await repository.create({
      approximateAge: input.approximateAge,
      birthDate: input.birthDate,
      breed: input.breed,
      creationRequestId: input.creationRequestId,
      desexedStatus: input.desexedStatus,
      id: petId,
      name: input.name,
      ownerId,
      photoPath,
      sex: input.sex,
      species: input.species,
      weightKg: input.weightKg,
    });
    if (!result.created && photoPath) await photoStorage.remove(photoPath);
    return result.pet;
  } catch (error) {
    if (photoPath) await photoStorage.remove(photoPath).catch(() => undefined);
    throw error;
  }
}
