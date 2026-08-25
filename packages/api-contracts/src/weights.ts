import { weightReminderFrequencies } from "@petmosphere/domain";
import { z } from "zod";

const weightSchema = z
  .number()
  .positive("Enter a weight greater than 0 kg.")
  .max(300, "Enter a weight of 300 kg or less.")
  .refine(
    (value) => Number.isInteger(value * 100),
    "Use no more than two decimal places.",
  );

export const saveWeightSchema = z
  .object({ petId: z.uuid(), weightKg: weightSchema })
  .strict();

export const weightEntryResponseSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  derivationTimezone: z.literal("Australia/Melbourne"),
  id: z.uuid(),
  localDate: z.iso.date(),
  petId: z.uuid(),
  source: z.literal("web"),
  updatedAt: z.iso.datetime({ offset: true }),
  weightKg: weightSchema,
});

export const weightReminderSchema = z
  .object({
    enabled: z.boolean(),
    frequency: z.enum(weightReminderFrequencies),
    localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    petId: z.uuid(),
    scheduleDay: z.number().int().min(0).max(31),
    timezone: z.literal("Australia/Melbourne"),
  })
  .superRefine((value, context) => {
    const weekly =
      value.frequency === "weekly" || value.frequency === "fortnightly";
    if (weekly && value.scheduleDay > 6) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid weekday.",
        path: ["scheduleDay"],
      });
    }
    if (!weekly && value.scheduleDay < 1) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid day of the month.",
        path: ["scheduleDay"],
      });
    }
  });

export const weightReminderResponseSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(weightReminderFrequencies),
  localTime: z.string(),
  petId: z.uuid(),
  scheduleDay: z.number().int().min(0).max(31),
  timezone: z.literal("Australia/Melbourne"),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type SaveWeightInput = z.infer<typeof saveWeightSchema>;
export type WeightEntryResponse = z.infer<typeof weightEntryResponseSchema>;
export type WeightReminderInput = z.infer<typeof weightReminderSchema>;
export type WeightReminderResponse = z.infer<
  typeof weightReminderResponseSchema
>;
