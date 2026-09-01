export const petSpecies = ["dog", "cat", "other"] as const;
export const petAgeBands = ["baby", "young", "adult", "senior"] as const;
export const petSexes = ["male", "female", "unknown"] as const;
export const petDesexedStatuses = ["yes", "no", "unknown"] as const;

export const MAX_PETS_FREE = 1;
export const MAX_PETS_SUBSCRIBED = 3;

export function getMaxPets(isSubscribed: boolean) {
  return isSubscribed ? MAX_PETS_SUBSCRIBED : MAX_PETS_FREE;
}

export type PetSpecies = (typeof petSpecies)[number];
export type PetAgeBand = (typeof petAgeBands)[number];
export type PetSex = (typeof petSexes)[number];
export type PetDesexedStatus = (typeof petDesexedStatuses)[number];

export type Pet = {
  approximateAge: PetAgeBand | null;
  birthDate: string | null;
  breed: string | null;
  createdAt: string;
  desexedStatus: PetDesexedStatus | null;
  id: string;
  name: string;
  ownerId: string;
  photoPath: string | null;
  sex: PetSex | null;
  species: PetSpecies;
  updatedAt: string;
  weightKg: number | null;
};

export type NewPet = Omit<Pet, "createdAt" | "photoPath" | "updatedAt"> & {
  creationRequestId: string;
  photoPath?: string | null;
};

const ageBandLabels: Record<PetAgeBand, string> = {
  adult: "Adult",
  baby: "Puppy / kitten",
  senior: "Senior",
  young: "Young",
};

export function getPetAgeLabel(
  pet: Pick<Pet, "approximateAge" | "birthDate">,
  today = new Date(),
) {
  if (pet.birthDate) {
    const birthDate = new Date(`${pet.birthDate}T00:00:00`);
    let years = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    if (!birthdayHasPassed) years -= 1;
    if (years <= 0) return "Under 1 year";
    return `${years} ${years === 1 ? "year" : "years"}`;
  }

  return pet.approximateAge ? ageBandLabels[pet.approximateAge] : null;
}
