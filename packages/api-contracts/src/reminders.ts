import { reminderCategories, reminderRepeatRules } from "@petmosphere/domain";
import { z } from "zod";

export const reminderStatusSchema = z.enum([
  "upcoming",
  "completed",
  "overdue",
]);
const dateSchema = z.iso.date({ error: "Choose a valid date." });
const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");
const noteSchema = z
  .string()
  .trim()
  .max(1_000, "Keep the note under 1,000 characters.")
  .transform((value) => value || undefined)
  .optional();

const reminderFields = {
  category: z.enum(reminderCategories),
  dueDate: dateSchema,
  localTime: localTimeSchema,
  note: noteSchema,
  petId: z.uuid(),
  repeatRule: z.enum(reminderRepeatRules),
  timezone: z.literal("Australia/Melbourne"),
  title: z
    .string()
    .trim()
    .min(1, "Enter a reminder title.")
    .max(100, "Keep the title under 100 characters."),
};

export const createReminderSchema = z
  .object({
    ...reminderFields,
    creationRequestId: z.uuid(),
  })
  .strict();

export const updateReminderSchema = z
  .object({
    ...reminderFields,
    reminderId: z.uuid(),
  })
  .strict();

export const reminderResponseSchema = z.object({
  category: z.enum(reminderCategories),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  dueDate: dateSchema,
  id: z.uuid(),
  localTime: localTimeSchema,
  note: z.string().nullable(),
  petId: z.uuid(),
  repeatRule: z.enum(reminderRepeatRules),
  seriesId: z.uuid(),
  timezone: z.literal("Australia/Melbourne"),
  title: z.string(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const completeReminderResponseSchema = z.object({
  completed: reminderResponseSchema,
  next: reminderResponseSchema.nullable(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type ReminderResponse = z.infer<typeof reminderResponseSchema>;
export type ReminderStatus = z.infer<typeof reminderStatusSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
