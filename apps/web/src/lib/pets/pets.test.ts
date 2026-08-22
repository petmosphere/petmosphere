import { createPetSchema, updatePetSchema } from "@petmosphere/api-contracts";
import { getPetAgeLabel, type Pet } from "@petmosphere/domain";
import { createPet, updatePet } from "@petmosphere/services";
import { describe, expect, it } from "vitest";

describe("pet contracts", () => {
  it("trims required fields and keeps optional fields optional", () => {
    const result = createPetSchema.parse({
      approximateAge: "",
      birthDate: "",
      breed: "",
      creationRequestId: "10000000-0000-4000-8000-000000000001",
      desexedStatus: "",
      name: "  Max  ",
      sex: "",
      species: "dog",
      weightKg: "",
    });

    expect(result).toMatchObject({ name: "Max", species: "dog" });
    expect(result.birthDate).toBeUndefined();
    expect(result.weightKg).toBeUndefined();
  });

  it("rejects conflicting age sources", () => {
    const result = createPetSchema.safeParse({
      approximateAge: "adult",
      birthDate: "2023-03-15",
      breed: "",
      creationRequestId: "10000000-0000-4000-8000-000000000001",
      desexedStatus: "",
      name: "Max",
      sex: "",
      species: "dog",
      weightKg: "",
    });

    expect(result.success).toBe(false);
  });

  it("validates an update without a creation request identifier", () => {
    expect(
      updatePetSchema.parse({
        approximateAge: "",
        birthDate: "",
        breed: " Kelpie ",
        desexedStatus: "yes",
        name: " Max ",
        sex: "male",
        species: "dog",
        weightKg: "18",
      }),
    ).toMatchObject({ breed: "Kelpie", name: "Max", weightKg: 18 });
  });
});

describe("pet age display", () => {
  it("formats a completed birthday in whole years", () => {
    const pet = {
      approximateAge: null,
      birthDate: "2023-03-15",
    } satisfies Pick<Pet, "approximateAge" | "birthDate">;

    expect(getPetAgeLabel(pet, new Date("2026-08-15T00:00:00Z"))).toBe(
      "3 years",
    );
  });
});

describe("pet creation", () => {
  it("returns the existing pet for a repeated creation request", async () => {
    const existingPet: Pet = {
      approximateAge: null,
      birthDate: null,
      breed: null,
      createdAt: "2026-08-15T00:00:00.000Z",
      desexedStatus: null,
      id: "20000000-0000-4000-8000-000000000002",
      name: "Max",
      ownerId: "30000000-0000-4000-8000-000000000003",
      photoPath: null,
      sex: null,
      species: "dog",
      updatedAt: "2026-08-15T00:00:00.000Z",
      weightKg: null,
    };

    const result = await createPet(
      existingPet.ownerId,
      {
        approximateAge: null,
        birthDate: null,
        breed: null,
        creationRequestId: "10000000-0000-4000-8000-000000000001",
        desexedStatus: null,
        name: "Different retry data",
        sex: null,
        species: "cat",
        weightKg: null,
      },
      {
        create: async () => {
          throw new Error("create must not run for a completed request");
        },
        findByCreationRequest: async () => existingPet,
      },
      {
        remove: async () => undefined,
        upload: async () => {
          throw new Error("upload must not run for a completed request");
        },
      },
    );

    expect(result).toBe(existingPet);
  });
});

describe("pet updates", () => {
  it("updates an owner-scoped pet", async () => {
    const existingPet: Pet = {
      approximateAge: null,
      birthDate: null,
      breed: null,
      createdAt: "2026-08-15T00:00:00.000Z",
      desexedStatus: null,
      id: "20000000-0000-4000-8000-000000000002",
      name: "Max",
      ownerId: "30000000-0000-4000-8000-000000000003",
      photoPath: null,
      sex: null,
      species: "dog",
      updatedAt: "2026-08-15T00:00:00.000Z",
      weightKg: null,
    };

    const result = await updatePet(
      existingPet.ownerId,
      existingPet.id,
      {
        approximateAge: null,
        birthDate: null,
        breed: "Kelpie",
        desexedStatus: "yes",
        name: "Max",
        sex: "male",
        species: "dog",
        weightKg: 18,
      },
      {
        findOwned: async () => existingPet,
        update: async (_ownerId, _petId, details) => ({
          ...existingPet,
          ...details,
        }),
      },
      {
        remove: async () => undefined,
        upload: async () => {
          throw new Error("upload must not run without a new photo");
        },
      },
    );

    expect(result).toMatchObject({ breed: "Kelpie", weightKg: 18 });
  });
});
