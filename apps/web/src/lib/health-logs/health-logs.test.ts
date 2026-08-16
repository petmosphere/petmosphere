import {
  createHealthLogSchema,
  healthLogReminderSchema,
  webPushSubscriptionSchema,
} from "@petmosphere/api-contracts";
import { deriveLocalDate, type HealthLog } from "@petmosphere/domain";
import {
  createHealthLog,
  FutureHealthLogDateError,
  PetMembershipError,
} from "@petmosphere/services";
import { describe, expect, it } from "vitest";

const existingHealthLog: HealthLog = {
  createdAt: "2026-08-15T10:00:00.000Z",
  derivationTimezone: "Australia/Melbourne",
  id: "10000000-0000-4000-8000-000000000001",
  imagePaths: [],
  localDate: "2026-08-15",
  note: null,
  observations: [],
  ownerId: "20000000-0000-4000-8000-000000000002",
  petId: "30000000-0000-4000-8000-000000000003",
  source: "web",
  status: "doing_well",
  updatedAt: "2026-08-15T10:00:00.000Z",
};

describe("health log contracts", () => {
  it("requires a non-diagnostic status while keeping note optional", () => {
    const valid = createHealthLogSchema.parse({
      creationRequestId: "40000000-0000-4000-8000-000000000004",
      note: "",
      localDate: "2026-08-15",
      observations: [],
      petId: existingHealthLog.petId,
      status: "doing_well",
      timezone: "Australia/Melbourne",
    });
    expect(valid.note).toBeUndefined();

    const invalid = createHealthLogSchema.safeParse({
      ...valid,
      status: "healthy",
    });
    expect(invalid.success).toBe(false);

    const mismatchedObservation = createHealthLogSchema.safeParse({
      ...valid,
      observations: ["vomited"],
    });
    expect(mismatchedObservation.success).toBe(false);
  });

  it("derives the local date at an Australian timezone boundary", () => {
    const instant = new Date("2026-08-15T14:30:00.000Z");
    expect(deriveLocalDate(instant, "Australia/Melbourne")).toBe("2026-08-16");
    expect(deriveLocalDate(instant, "Australia/Perth")).toBe("2026-08-15");
  });

  it("accepts Melbourne reminder time and rejects insecure push endpoints", () => {
    expect(
      healthLogReminderSchema.safeParse({
        enabled: true,
        localTime: "19:00",
        petId: existingHealthLog.petId,
        timezone: "Australia/Melbourne",
      }).success,
    ).toBe(true);
    expect(
      webPushSubscriptionSchema.safeParse({
        auth: "auth",
        endpoint: "http://push.example.test/subscription",
        p256dh: "key",
      }).success,
    ).toBe(false);
  });
});

describe("health log creation", () => {
  it("returns the first result for an idempotent retry without uploading again", async () => {
    const result = await createHealthLog(
      existingHealthLog.ownerId,
      {
        creationRequestId: "40000000-0000-4000-8000-000000000004",
        images: [],
        localDate: "2026-08-15",
        note: "A retry must not replace this record.",
        observations: [],
        petId: existingHealthLog.petId,
        status: "concerned",
        timezone: "Australia/Melbourne",
      },
      {
        create: async () => {
          throw new Error("create must not run for a completed request");
        },
        findById: async () => null,
        findByPetAndDate: async () => null,
        findByRequest: async () => existingHealthLog,
        listByMonth: async () => [],
        ownerHasPet: async () => true,
        delete: async () => existingHealthLog,
        update: async () => {
          throw new Error("update must not run");
        },
      },
      {
        remove: async () => undefined,
        upload: async () => {
          throw new Error("upload must not run for a completed request");
        },
      },
    );

    expect(result).toEqual({ created: false, healthLog: existingHealthLog });
  });

  it("rejects access before reading or writing another owner pet", async () => {
    await expect(
      createHealthLog(
        existingHealthLog.ownerId,
        {
          creationRequestId: "40000000-0000-4000-8000-000000000004",
          images: [],
          localDate: "2026-08-15",
          note: null,
          observations: [],
          petId: existingHealthLog.petId,
          status: "doing_well",
          timezone: "Australia/Melbourne",
        },
        {
          create: async () => {
            throw new Error("create must not run");
          },
          findById: async () => null,
          findByPetAndDate: async () => null,
          findByRequest: async () => null,
          listByMonth: async () => [],
          ownerHasPet: async () => false,
          delete: async () => existingHealthLog,
          update: async () => {
            throw new Error("update must not run");
          },
        },
        { remove: async () => undefined, upload: async () => "" },
      ),
    ).rejects.toBeInstanceOf(PetMembershipError);
  });

  it("rejects a future local date before uploading images", async () => {
    await expect(
      createHealthLog(
        existingHealthLog.ownerId,
        {
          creationRequestId: "40000000-0000-4000-8000-000000000004",
          images: [],
          localDate: "2026-08-16",
          note: null,
          observations: [],
          petId: existingHealthLog.petId,
          status: "doing_well",
          timezone: "Australia/Melbourne",
        },
        {
          create: async () => {
            throw new Error("create must not run");
          },
          delete: async () => existingHealthLog,
          findById: async () => null,
          findByPetAndDate: async () => null,
          findByRequest: async () => null,
          listByMonth: async () => [],
          ownerHasPet: async () => true,
          update: async () => {
            throw new Error("update must not run");
          },
        },
        { remove: async () => undefined, upload: async () => "" },
        new Date("2026-08-15T03:00:00.000Z"),
      ),
    ).rejects.toBeInstanceOf(FutureHealthLogDateError);
  });
});
