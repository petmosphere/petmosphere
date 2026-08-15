import * as Sentry from "@sentry/nextjs";
import type { NewPet, Pet } from "@petmosphere/domain";
import type { PetPhotoStorage, PetRepository } from "@petmosphere/services";
import type { SupabaseClient } from "@supabase/supabase-js";

const petColumns =
  "id, owner_id, name, species, breed, birth_date, approximate_age, sex, weight_kg, desexed_status, photo_path, created_at, updated_at";

type PetRow = {
  approximate_age: Pet["approximateAge"];
  birth_date: string | null;
  breed: string | null;
  created_at: string;
  desexed_status: Pet["desexedStatus"];
  id: string;
  name: string;
  owner_id: string;
  photo_path: string | null;
  sex: Pet["sex"];
  species: Pet["species"];
  updated_at: string;
  weight_kg: number | null;
};

function toPet(row: PetRow): Pet {
  return {
    approximateAge: row.approximate_age,
    birthDate: row.birth_date,
    breed: row.breed,
    createdAt: row.created_at,
    desexedStatus: row.desexed_status,
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    photoPath: row.photo_path,
    sex: row.sex,
    species: row.species,
    updatedAt: row.updated_at,
    weightKg: row.weight_kg,
  };
}

async function findByCreationRequest(
  supabase: SupabaseClient,
  ownerId: string,
  requestId: string,
) {
  const { data, error } = await supabase
    .from("pets")
    .select(petColumns)
    .eq("owner_id", ownerId)
    .eq("creation_request_id", requestId)
    .maybeSingle();
  if (error) throw error;
  return data ? toPet(data as PetRow) : null;
}

export function createPetRepository(supabase: SupabaseClient): PetRepository {
  return {
    async create(pet: NewPet) {
      const { data, error } = await supabase
        .from("pets")
        .insert({
          approximate_age: pet.approximateAge,
          birth_date: pet.birthDate,
          breed: pet.breed,
          creation_request_id: pet.creationRequestId,
          desexed_status: pet.desexedStatus,
          id: pet.id,
          name: pet.name,
          owner_id: pet.ownerId,
          photo_path: pet.photoPath ?? null,
          sex: pet.sex,
          species: pet.species,
          weight_kg: pet.weightKg,
        })
        .select(petColumns)
        .single();

      if (!error && data) return { created: true, pet: toPet(data as PetRow) };
      if (error?.code === "23505") {
        const existing = await findByCreationRequest(
          supabase,
          pet.ownerId,
          pet.creationRequestId,
        );
        if (existing) return { created: false, pet: existing };
      }
      throw error ?? new Error("Pet creation returned no data.");
    },
    findByCreationRequest: (ownerId, requestId) =>
      findByCreationRequest(supabase, ownerId, requestId),
  };
}

export function createPetPhotoStorage(
  supabase: SupabaseClient,
): PetPhotoStorage {
  return {
    async remove(path) {
      const { error } = await supabase.storage
        .from("pet-photos")
        .remove([path]);
      if (error) throw error;
    },
    async upload({ ownerId, petId, photo }) {
      const path = `${ownerId}/${petId}/profile.webp`;
      const { error } = await supabase.storage
        .from("pet-photos")
        .upload(path, photo.bytes, {
          contentType: photo.contentType,
          upsert: false,
        });
      if (error) throw error;
      return path;
    },
  };
}

export async function listOwnedPets(supabase: SupabaseClient, ownerId: string) {
  const { data, error } = await supabase
    .from("pets")
    .select(petColumns)
    .eq("owner_id", ownerId)
    .order("created_at");
  if (error) throw error;
  return (data as PetRow[]).map(toPet);
}

export async function getOwnedPet(
  supabase: SupabaseClient,
  ownerId: string,
  petId: string,
) {
  const { data, error } = await supabase
    .from("pets")
    .select(petColumns)
    .eq("owner_id", ownerId)
    .eq("id", petId)
    .maybeSingle();
  if (error) throw error;
  return data ? toPet(data as PetRow) : null;
}

export async function getPetPhotoUrl(
  supabase: SupabaseClient,
  photoPath: string | null,
) {
  if (!photoPath) return null;
  const { data, error } = await supabase.storage
    .from("pet-photos")
    .createSignedUrl(photoPath, 60 * 60);
  if (!error) return data.signedUrl;

  Sentry.captureException(error, {
    tags: { operation: "pet_photo_signed_url" },
  });
  return null;
}
