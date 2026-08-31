import { notificationKinds } from "@petmosphere/domain";
import { z } from "zod";

export const notificationResponseSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
  kind: z.enum(notificationKinds),
  localDate: z.iso.date().nullable(),
  message: z.string(),
  petId: z.uuid().nullable(),
  readAt: z.iso.datetime({ offset: true }).nullable(),
  reminderId: z.uuid().nullable(),
  title: z.string(),
});

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationResponseSchema),
  unreadCount: z.number().int().nonnegative(),
});

export const markNotificationsReadSchema = z.union([
  z.object({ all: z.literal(true) }).strict(),
  z.object({ notificationId: z.uuid() }).strict(),
]);

export type MarkNotificationsReadInput = z.infer<
  typeof markNotificationsReadSchema
>;
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;
