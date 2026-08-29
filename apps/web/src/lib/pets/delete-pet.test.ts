import { deletePet } from "@petmosphere/services";
import { describe, expect, it, vi } from "vitest";

const pet = {
  approximateAge: null,
  birthDate: null,
  breed: null,
  createdAt: "2026-08-25T00:00:00.000Z",
  desexedStatus: null,
  id: "20000000-0000-4000-8000-000000000002",
  name: "Max",
  ownerId: "30000000-0000-4000-8000-000000000003",
  photoPath: "owner/pet/profile.webp",
  sex: null,
  species: "dog" as const,
  updatedAt: "2026-08-25T00:00:00.000Z",
  weightKg: null,
};

describe("deletePet", () => {
  it("deletes the owned pet before cleaning up its private media", async () => {
    const order: string[] = [];
    const result = await deletePet(
      pet.ownerId,
      pet.id,
      {
        delete: vi.fn(async () => {
          order.push("delete");
          return pet;
        }),
        findOwned: vi.fn(async () => pet),
        listHealthLogImagePaths: vi.fn(async () => ["owner/pet/log.webp"]),
      },
      {
        remove: vi.fn(async () => {
          order.push("pet-photo");
        }),
        upload: vi.fn(async () => "owner/pet/new.webp"),
      },
      {
        remove: vi.fn(async () => {
          order.push("health-log-images");
        }),
      },
    );

    expect(result).toEqual({ cleanupFailed: false, deleted: true });
    expect(order[0]).toBe("delete");
  });
});
