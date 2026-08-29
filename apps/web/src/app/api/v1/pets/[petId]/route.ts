import * as Sentry from "@sentry/nextjs";
import {
  deletePetSchema,
  petResponseSchema,
  updatePetSchema,
} from "@petmosphere/api-contracts";
import { deletePet, updatePet } from "@petmosphere/services";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createHealthLogImageStorage } from "@/lib/health-logs/supabase-health-logs";
import {
  createPetPhotoStorage,
  createPetRepository,
  getPetPhotoUrl,
} from "@/lib/pets/supabase-pets";
import { InvalidPetPhotoError, preparePetPhoto } from "@/lib/pets/photo";
import { createClient } from "@/lib/supabase/server";

function readPetFields(formData: FormData) {
  return Object.fromEntries(
    [
      "approximateAge",
      "birthDate",
      "breed",
      "desexedStatus",
      "name",
      "sex",
      "species",
      "weightKg",
    ].map((key) => [key, formData.get(key)?.toString() ?? ""]),
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ petId: string }> },
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json(
      { message: "Sign in to delete your pet." },
      { status: 401 },
    );
  }

  const parsed = deletePetSchema.safeParse({ petId: (await params).petId });
  if (!parsed.success) {
    return NextResponse.json({ message: "Pet not found." }, { status: 404 });
  }

  try {
    const result = await deletePet(
      authData.user.id,
      parsed.data.petId,
      createPetRepository(supabase),
      createPetPhotoStorage(supabase),
      createHealthLogImageStorage(supabase),
    );
    if (result.cleanupFailed) {
      Sentry.captureMessage("Pet media cleanup failed after deletion.", {
        level: "error",
        tags: { operation: "delete_pet_media_cleanup" },
      });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    Sentry.captureException(error, { tags: { operation: "delete_pet" } });
    return NextResponse.json(
      { message: "We could not delete your pet. Try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ petId: string }> },
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json(
      { message: "Sign in to update your pet." },
      { status: 401 },
    );
  }

  const parsedPetId = z.uuid().safeParse((await params).petId);
  if (!parsedPetId.success) {
    return NextResponse.json({ message: "Pet not found." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const parsed = updatePetSchema.safeParse(readPetFields(formData));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Check your pet's details.",
        },
        { status: 400 },
      );
    }

    const photoEntry = formData.get("photo");
    const photo =
      photoEntry instanceof File && photoEntry.size > 0
        ? await preparePetPhoto(photoEntry)
        : undefined;
    const pet = await updatePet(
      authData.user.id,
      parsedPetId.data,
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
    );
    if (!pet) {
      return NextResponse.json({ message: "Pet not found." }, { status: 404 });
    }

    return NextResponse.json(
      petResponseSchema.parse({
        approximateAge: pet.approximateAge,
        birthDate: pet.birthDate,
        breed: pet.breed,
        createdAt: pet.createdAt,
        desexedStatus: pet.desexedStatus,
        id: pet.id,
        name: pet.name,
        photoUrl: await getPetPhotoUrl(supabase, pet.photoPath),
        sex: pet.sex,
        species: pet.species,
        updatedAt: pet.updatedAt,
        weightKg: pet.weightKg,
      }),
    );
  } catch (error) {
    if (error instanceof InvalidPetPhotoError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    Sentry.captureException(error, { tags: { operation: "update_pet" } });
    return NextResponse.json(
      {
        message:
          "We could not update your pet. Check your connection and try again.",
      },
      { status: 500 },
    );
  }
}
