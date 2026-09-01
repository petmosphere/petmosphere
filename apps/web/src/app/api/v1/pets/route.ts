import * as Sentry from "@sentry/nextjs";
import { createPetSchema, petResponseSchema } from "@petmosphere/api-contracts";
import { createPet, PetLimitReachedError } from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createPetPhotoStorage,
  createPetRepository,
  getPetPhotoUrl,
} from "@/lib/pets/supabase-pets";
import { getProfile } from "@/lib/profile/supabase-profile";
import { InvalidPetPhotoError, preparePetPhoto } from "@/lib/pets/photo";
import { createClient } from "@/lib/supabase/server";

function readPetFields(formData: FormData) {
  return Object.fromEntries(
    [
      "approximateAge",
      "birthDate",
      "breed",
      "creationRequestId",
      "desexedStatus",
      "name",
      "sex",
      "species",
      "weightKg",
    ].map((key) => [key, formData.get(key)?.toString() ?? ""]),
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json(
      { message: "Sign in to add a pet." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const parsed = createPetSchema.safeParse(readPetFields(formData));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Check your pet's details.",
        },
        { status: 400 },
      );
    }

    const profile = await getProfile(supabase, authData.user.id);

    const photoEntry = formData.get("photo");
    const photo =
      photoEntry instanceof File && photoEntry.size > 0
        ? await preparePetPhoto(photoEntry)
        : undefined;
    const pet = await createPet(
      authData.user.id,
      {
        ...parsed.data,
        approximateAge: parsed.data.approximateAge ?? null,
        birthDate: parsed.data.birthDate ?? null,
        breed: parsed.data.breed ?? null,
        desexedStatus: parsed.data.desexedStatus ?? null,
        ...(photo ? { photo } : {}),
        sex: parsed.data.sex ?? null,
        weightKg: parsed.data.weightKg ?? null,
      },
      createPetRepository(supabase),
      createPetPhotoStorage(supabase),
      profile.isSubscribed,
    );
    const photoUrl = await getPetPhotoUrl(supabase, pet.photoPath);

    return NextResponse.json(
      petResponseSchema.parse({
        approximateAge: pet.approximateAge,
        birthDate: pet.birthDate,
        breed: pet.breed,
        createdAt: pet.createdAt,
        desexedStatus: pet.desexedStatus,
        id: pet.id,
        name: pet.name,
        photoUrl,
        sex: pet.sex,
        species: pet.species,
        updatedAt: pet.updatedAt,
        weightKg: pet.weightKg,
      }),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof InvalidPetPhotoError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof PetLimitReachedError) {
      return NextResponse.json(
        {
          code: "PET_LIMIT_REACHED",
          message: "Subscribe to add more pets.",
        },
        { status: 403 },
      );
    }
    Sentry.captureException(error, { tags: { operation: "create_pet" } });
    return NextResponse.json(
      {
        message:
          "We could not save your pet. Check your connection and try again.",
      },
      { status: 500 },
    );
  }
}
