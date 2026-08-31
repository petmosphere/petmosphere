import {
  petAgeBands,
  petDesexedStatuses,
  petSexes,
  petSpecies,
  weightFromKilograms,
  type WeightUnit,
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

const weightField = (unit: WeightUnit) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number(value)) &&
          Number(value) > 0 &&
          Number(value) <= weightFromKilograms(300, unit)),
      `Enter a weight between 0 and ${Number(weightFromKilograms(300, unit).toFixed(2))} ${unit}.`,
    )
    .transform((value) => (value === "" ? undefined : Number(value)));

const petFields = {
  approximateAge: optionalChoice(petAgeBands),
  birthDate: z
    .union([z.literal(""), z.iso.date()])
    .transform((value) => value || undefined),
  breed: optionalText(100),
  desexedStatus: optionalChoice(petDesexedStatuses),
  name: z.string().trim().min(1, "Enter your pet's name.").max(80),
  sex: optionalChoice(petSexes),
  species: z.enum(petSpecies, { error: "Choose your pet's species." }),
  weightKg: weightField("kg"),
};

const validateAge = (
  {
    approximateAge,
    birthDate,
  }: {
    approximateAge: string | undefined;
    birthDate: string | undefined;
  },
  context: z.RefinementCtx,
) => {
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
};

export const updatePetSchema = z.object(petFields).superRefine(validateAge);

export const createUpdatePetFormSchema = (unit: WeightUnit) =>
  z
    .object({ ...petFields, weightKg: weightField(unit) })
    .superRefine(validateAge);

export const createPetSchema = z
  .object({
    ...petFields,
    creationRequestId: z.uuid(),
  })
  .superRefine(validateAge)
  .superRefine(({ birthDate, approximateAge }, ctx) => {
    if (!birthDate && !approximateAge) {
      ctx.addIssue({
        code: "custom",
        message: "Enter your pet's date of birth or select an approximate age.",
        path: ["birthDate"],
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

export const deletePetSchema = z.object({ petId: z.uuid() });

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type CreatePetFormInput = z.input<typeof createPetSchema>;
export type PetResponse = z.infer<typeof petResponseSchema>;
export type UpdatePetFormInput = z.input<typeof updatePetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
