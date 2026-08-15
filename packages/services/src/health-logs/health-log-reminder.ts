import type { HealthLogReminder } from "@petmosphere/domain";

import { PetMembershipError, type HealthLogRepository } from "./save-health-log";

export type HealthLogReminderRepository = {
  find(ownerId: string, petId: string): Promise<HealthLogReminder | null>;
  save(input: Omit<HealthLogReminder, "updatedAt">): Promise<HealthLogReminder>;
};

export async function getHealthLogReminder(
  ownerId: string,
  petId: string,
  healthLogs: HealthLogRepository,
  reminders: HealthLogReminderRepository,
) {
  if (!(await healthLogs.ownerHasPet(ownerId, petId))) {
    throw new PetMembershipError("Pet not found.");
  }
  return reminders.find(ownerId, petId);
}

export async function saveHealthLogReminder(
  ownerId: string,
  input: { enabled: boolean; localTime: string; petId: string; timezone: string },
  healthLogs: HealthLogRepository,
  reminders: HealthLogReminderRepository,
) {
  if (!(await healthLogs.ownerHasPet(ownerId, input.petId))) {
    throw new PetMembershipError("Pet not found.");
  }
  return reminders.save({ ...input, ownerId });
}
