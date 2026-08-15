import {
  healthLogObservations,
  healthLogStatuses,
  isHealthLogObservationForStatus,
  maxHealthLogImages,
} from "@petmosphere/domain";
import { z } from "zod";

export const MAX_HEALTH_LOG_IMAGES = maxHealthLogImages;
export const MAX_HEALTH_LOG_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_HEALTH_LOG_NOTE_LENGTH = 4_000;
export const HEALTH_LOG_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-AU", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone.");

const noteSchema = z
  .string()
  .trim()
  .max(
    MAX_HEALTH_LOG_NOTE_LENGTH,
    `Keep your note under ${MAX_HEALTH_LOG_NOTE_LENGTH.toLocaleString("en-AU")} characters.`,
  )
  .transform((value) => value || undefined);

const dateSchema = z.iso.date({ error: "Choose a valid date." });
const observationsSchema = z.array(z.enum(healthLogObservations)).max(6);

function healthLogFields<T extends z.ZodRawShape>(shape: T) {
  return z
    .object({
      ...shape,
      localDate: dateSchema,
      note: noteSchema,
      observations: observationsSchema,
      petId: z.uuid(),
      status: z.enum(healthLogStatuses, {
        error: "Choose how your pet was feeling.",
      }),
      timezone: timezoneSchema,
    })
    .superRefine((value, context) => {
      const invalid = value.observations.find(
        (observation) =>
          !isHealthLogObservationForStatus(observation, value.status),
      );
      if (invalid) {
        context.addIssue({
          code: "custom",
          message: "Choose descriptions that match the selected emotion.",
          path: ["observations"],
        });
      }
    });
}

export const createHealthLogSchema = healthLogFields({
  creationRequestId: z.uuid(),
});

export const updateHealthLogSchema = healthLogFields({
  healthLogId: z.uuid(),
  retainedImageIndexes: z
    .array(z.number().int().min(0).max(MAX_HEALTH_LOG_IMAGES - 1))
    .max(MAX_HEALTH_LOG_IMAGES),
});

export const healthLogQuerySchema = z.discriminatedUnion("scope", [
  z
    .object({ localDate: dateSchema, petId: z.uuid(), scope: z.literal("date") })
    .strict(),
  z
    .object({
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      petId: z.uuid(),
      scope: z.literal("month"),
    })
    .strict(),
]);

export const deleteHealthLogSchema = z
  .object({ healthLogId: z.uuid(), petId: z.uuid() })
  .strict();

export const healthLogResponseSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  derivationTimezone: z.string(),
  id: z.uuid(),
  imageUrls: z.array(z.url()),
  localDate: z.iso.date(),
  note: z.string().nullable(),
  observations: observationsSchema,
  petId: z.uuid(),
  source: z.literal("web"),
  status: z.enum(healthLogStatuses),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const healthLogSummarySchema = healthLogResponseSchema.pick({
  id: true,
  localDate: true,
  status: true,
});

export const healthLogReminderSchema = z.object({
  enabled: z.boolean(),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  petId: z.uuid(),
  timezone: timezoneSchema,
});

export const healthLogReminderResponseSchema = healthLogReminderSchema.extend({
  updatedAt: z.iso.datetime({ offset: true }),
});

export const healthLogAnalyticsEventSchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("health_log_started") }).strict(),
  z
    .object({
      event: z.literal("health_log_completed"),
      imageCount: z.number().int().min(0).max(MAX_HEALTH_LOG_IMAGES),
      optionalFieldCount: z.number().int().min(0).max(3),
      timeToCompleteMs: z.number().int().min(0).max(86_400_000),
    })
    .strict(),
  z.object({ event: z.literal("health_log_save_failed") }).strict(),
]);

export type CreateHealthLogInput = z.infer<typeof createHealthLogSchema>;
export type CreateHealthLogFormInput = z.input<typeof createHealthLogSchema>;
export type HealthLogAnalyticsEvent = z.infer<
  typeof healthLogAnalyticsEventSchema
>;
export type HealthLogResponse = z.infer<typeof healthLogResponseSchema>;
export type HealthLogSummary = z.infer<typeof healthLogSummarySchema>;
export type HealthLogReminder = z.infer<typeof healthLogReminderResponseSchema>;
export type UpdateHealthLogInput = z.infer<typeof updateHealthLogSchema>;
