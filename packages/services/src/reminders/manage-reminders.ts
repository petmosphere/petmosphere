import {
  deriveLocalDate,
  nextReminderDate,
  type NewReminder,
  type Reminder,
  type ReminderCategory,
  type ReminderNotificationLeadMinutes,
  type ReminderRepeatRule,
} from "@petmosphere/domain";

export class ReminderNotFoundError extends Error {}
export class ReminderPastDateError extends Error {}
export class ReminderPetAccessError extends Error {}

export type ReminderStatus = "upcoming" | "completed" | "overdue";

export type ReminderRepository = {
  complete(
    ownerId: string,
    reminderId: string,
    nextDueDate: string | null,
  ): Promise<{ completed: Reminder; next: Reminder | null }>;
  create(
    reminder: NewReminder,
  ): Promise<{ created: boolean; reminder: Reminder }>;
  findById(ownerId: string, reminderId: string): Promise<Reminder | null>;
  findByRequest(ownerId: string, requestId: string): Promise<Reminder | null>;
  list(
    ownerId: string,
    status: ReminderStatus,
    localDate: string,
    localTime: string,
  ): Promise<Reminder[]>;
  ownerHasPet(ownerId: string, petId: string): Promise<boolean>;
  softDelete(ownerId: string, reminderId: string): Promise<Reminder>;
  update(input: {
    category: ReminderCategory;
    dueDate: string;
    localTime: string;
    note: string | null;
    notificationLeadMinutes: ReminderNotificationLeadMinutes | null;
    ownerId: string;
    petId: string;
    reminderId: string;
    repeatRule: ReminderRepeatRule;
    title: string;
  }): Promise<Reminder>;
};

type ReminderFields = {
  category: ReminderCategory;
  dueDate: string;
  localTime: string;
  note: string | null;
  notificationLeadMinutes: ReminderNotificationLeadMinutes | null;
  petId: string;
  repeatRule: ReminderRepeatRule;
  timezone: "Australia/Melbourne";
  title: string;
};

async function validateFields(
  ownerId: string,
  fields: ReminderFields,
  repository: ReminderRepository,
  now: Date,
) {
  if (!(await repository.ownerHasPet(ownerId, fields.petId))) {
    throw new ReminderPetAccessError("Pet not found.");
  }
  if (fields.dueDate < deriveLocalDate(now, fields.timezone)) {
    throw new ReminderPastDateError("Choose today or a future date.");
  }
}

export async function createReminder(
  ownerId: string,
  input: ReminderFields & { creationRequestId: string },
  repository: ReminderRepository,
  now = new Date(),
) {
  const retry = await repository.findByRequest(
    ownerId,
    input.creationRequestId,
  );
  if (retry) return { created: false, reminder: retry };
  await validateFields(ownerId, input, repository, now);
  const id = crypto.randomUUID();
  return repository.create({
    ...input,
    id,
    ownerId,
    seriesId: id,
    seriesStartDate: input.dueDate,
  });
}

export async function updateReminder(
  ownerId: string,
  reminderId: string,
  input: ReminderFields,
  repository: ReminderRepository,
  now = new Date(),
) {
  const existing = await repository.findById(ownerId, reminderId);
  if (!existing || existing.deletedAt || existing.completedAt) {
    throw new ReminderNotFoundError("Reminder not found.");
  }
  await validateFields(ownerId, input, repository, now);
  return repository.update({ ...input, ownerId, reminderId });
}

export async function completeReminder(
  ownerId: string,
  reminderId: string,
  repository: ReminderRepository,
  now = new Date(),
) {
  const reminder = await repository.findById(ownerId, reminderId);
  if (!reminder || reminder.deletedAt) {
    throw new ReminderNotFoundError("Reminder not found.");
  }
  if (reminder.completedAt) return { completed: reminder, next: null };
  const today = deriveLocalDate(now, reminder.timezone);
  const nextDueDate = nextReminderDate(
    reminder.seriesStartDate,
    reminder.repeatRule,
    today,
  );
  return repository.complete(ownerId, reminderId, nextDueDate);
}

export async function deleteReminder(
  ownerId: string,
  reminderId: string,
  repository: ReminderRepository,
) {
  const reminder = await repository.findById(ownerId, reminderId);
  if (!reminder || reminder.deletedAt || reminder.completedAt) {
    throw new ReminderNotFoundError("Reminder not found.");
  }
  return repository.softDelete(ownerId, reminderId);
}
