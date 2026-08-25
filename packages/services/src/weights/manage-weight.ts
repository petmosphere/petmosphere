import {
  deriveLocalDate,
  nextWeightReminderDate,
  type WeightEntry,
  type WeightReminder,
  type WeightReminderFrequency,
} from "@petmosphere/domain";

export class WeightPetAccessError extends Error {}

export type WeightRepository = {
  list(
    ownerId: string,
    petId: string,
    fromLocalDate: string,
  ): Promise<WeightEntry[]>;
  ownerHasPet(ownerId: string, petId: string): Promise<boolean>;
  save(
    entry: Omit<WeightEntry, "createdAt" | "id" | "updatedAt">,
  ): Promise<WeightEntry>;
};

export type WeightReminderRepository = {
  find(ownerId: string, petId: string): Promise<WeightReminder | null>;
  save(
    input: Omit<WeightReminder, "updatedAt"> & { nextDueDate: string },
  ): Promise<WeightReminder>;
};

async function requirePet(
  ownerId: string,
  petId: string,
  repository: Pick<WeightRepository, "ownerHasPet">,
) {
  if (!(await repository.ownerHasPet(ownerId, petId))) {
    throw new WeightPetAccessError("Pet not found.");
  }
}

function dateDaysAgo(localDate: string, days: number) {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function listWeights(
  ownerId: string,
  petId: string,
  repository: WeightRepository,
  now = new Date(),
) {
  await requirePet(ownerId, petId, repository);
  const today = deriveLocalDate(now, "Australia/Melbourne");
  return repository.list(ownerId, petId, dateDaysAgo(today, 179));
}

export async function saveWeight(
  ownerId: string,
  input: { petId: string; weightKg: number },
  repository: WeightRepository,
  now = new Date(),
) {
  await requirePet(ownerId, input.petId, repository);
  return repository.save({
    derivationTimezone: "Australia/Melbourne",
    localDate: deriveLocalDate(now, "Australia/Melbourne"),
    ownerId,
    petId: input.petId,
    source: "web",
    weightKg: input.weightKg,
  });
}

export async function getWeightReminder(
  ownerId: string,
  petId: string,
  weights: WeightRepository,
  reminders: WeightReminderRepository,
) {
  await requirePet(ownerId, petId, weights);
  return reminders.find(ownerId, petId);
}

export async function saveWeightReminder(
  ownerId: string,
  input: {
    enabled: boolean;
    frequency: WeightReminderFrequency;
    localTime: string;
    petId: string;
    scheduleDay: number;
    timezone: "Australia/Melbourne";
  },
  weights: WeightRepository,
  reminders: WeightReminderRepository,
  now = new Date(),
) {
  await requirePet(ownerId, input.petId, weights);
  const today = deriveLocalDate(now, input.timezone);
  return reminders.save({
    ...input,
    nextDueDate: nextWeightReminderDate(
      today,
      input.frequency,
      input.scheduleDay,
    ),
    ownerId,
  });
}
