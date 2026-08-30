import { z } from "zod";

export const PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_PROFILE_PHOTO_BYTES = 4 * 1024 * 1024;

const displayName = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(100, "Use no more than 100 characters.");

const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use no more than 72 characters.");

export const updateProfileSchema = z.object({ displayName });

export const updateUnitsSchema = z.object({
  weightUnit: z.enum(["kg", "lb"]),
});

export const updateReminderNotificationPreferencesSchema = z.object({
  alertLeadDays: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(7),
  ]),
  enabled: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password,
    confirmPassword: z.string(),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  confirmation: z.literal("DELETE", {
    error: "Type DELETE to confirm permanent account deletion.",
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUnitsInput = z.infer<typeof updateUnitsSchema>;
export type UpdateReminderNotificationPreferencesInput = z.infer<
  typeof updateReminderNotificationPreferencesSchema
>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
