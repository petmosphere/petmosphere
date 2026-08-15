import {
  petAgeBands,
  petDesexedStatuses,
  petSexes,
  petSpecies,
} from "@petmosphere/domain";
import { z } from "zod";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined);

const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.literal(""), z.enum(values)])
    .transform((value) => value || undefined);

export const MAX_PET_PHOTO_BYTES = 4 * 1024 * 1024;
export const PET_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

function todayInMelbourne() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Australia/Melbourne",
    year: "numeric",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const createPetSchema = z
  .object({
    approximateAge: optionalChoice(petAgeBands),
    birthDate: z
      .union([z.literal(""), z.iso.date()])
      .transform((value) => value || undefined),
    breed: optionalText(100),
    creationRequestId: z.uuid(),
    desexedStatus: optionalChoice(petDesexedStatuses),
    name: z.string().trim().min(1, "Enter your pet's name.").max(80),
    sex: optionalChoice(petSexes),
    species: z.enum(petSpecies, { error: "Choose your pet's species." }),
    weightKg: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (!Number.isNaN(Number(value)) &&
            Number(value) > 0 &&
            Number(value) <= 300),
        "Enter a weight between 0 and 300 kg.",
      )
      .transform((value) => (value === "" ? undefined : Number(value))),
  })
  .superRefine(({ approximateAge, birthDate }, context) => {
    if (birthDate && birthDate > todayInMelbourne()) {
      context.addIssue({
        code: "custom",
        message: "Date of birth cannot be in the future.",
        path: ["birthDate"],
      });
    }
    if (birthDate && approximateAge) {
      context.addIssue({
        code: "custom",
        message: "Choose a date of birth or an approximate age, not both.",
        path: ["approximateAge"],
      });
    }
  });

export const petResponseSchema = z.object({
  approximateAge: z.enum(petAgeBands).nullable(),
  birthDate: z.iso.date().nullable(),
  breed: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  desexedStatus: z.enum(petDesexedStatuses).nullable(),
  id: z.uuid(),
  name: z.string(),
  photoUrl: z.url().nullable(),
  sex: z.enum(petSexes).nullable(),
  species: z.enum(petSpecies),
  updatedAt: z.iso.datetime({ offset: true }),
  weightKg: z.number().nullable(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type CreatePetFormInput = z.input<typeof createPetSchema>;
export type PetResponse = z.infer<typeof petResponseSchema>;
