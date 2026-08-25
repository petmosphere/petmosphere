import {
  nextWeightReminderDate,
  weightTrendWindow,
  type WeightEntry,
  type WeightReminder,
} from "@petmosphere/domain";
import {
  saveWeight,
  saveWeightReminder,
  type WeightReminderRepository,
  type WeightRepository,
} from "@petmosphere/services";
import { describe, expect, it } from "vitest";

function entry(localDate: string, weightKg = 8.6): WeightEntry {
  return {
    createdAt: "2026-08-25T10:00:00.000Z",
    derivationTimezone: "Australia/Melbourne",
    id: crypto.randomUUID(),
    localDate,
    ownerId: "owner",
    petId: "pet",
    source: "web",
    updatedAt: "2026-08-25T10:00:00.000Z",
    weightKg,
  };
}

function repositories() {
  let savedEntry: WeightEntry | null = null;
  let savedReminder: WeightReminder | null = null;
  const weights: WeightRepository = {
    list: async () => [],
    ownerHasPet: async () => true,
    save: async (input) => {
      savedEntry = entry(input.localDate, input.weightKg);
      return savedEntry;
    },
  };
  const reminders: WeightReminderRepository = {
    find: async () => savedReminder,
    save: async (input) => {
      savedReminder = {
        ...input,
        updatedAt: "2026-08-25T10:00:00.000Z",
      };
      return savedReminder;
    },
  };
  return { reminders, weights };
}

describe("weight tracking", () => {
  it("derives Melbourne today on the server", async () => {
    const { weights } = repositories();
    const saved = await saveWeight(
      "owner",
      { petId: "pet", weightKg: 8.65 },
      weights,
      new Date("2026-08-25T14:30:00.000Z"),
    );
    expect(saved.localDate).toBe("2026-08-26");
    expect(saved.weightKg).toBe(8.65);
  });

  it("uses 30, 90 and 180 day trend windows", () => {
    expect(weightTrendWindow([entry("2026-08-01"), entry("2026-08-25")])).toBe(
      30,
    );
    expect(weightTrendWindow([entry("2026-06-01"), entry("2026-08-25")])).toBe(
      90,
    );
    expect(weightTrendWindow([entry("2026-01-01"), entry("2026-08-25")])).toBe(
      180,
    );
  });

  it("uses the selected weekday for weekly schedules", () => {
    expect(nextWeightReminderDate("2026-08-25", "weekly", 0)).toBe(
      "2026-08-30",
    );
  });

  it("saves a weekly 8pm reminder", async () => {
    const { reminders, weights } = repositories();
    const saved = await saveWeightReminder(
      "owner",
      {
        enabled: true,
        frequency: "weekly",
        localTime: "20:00",
        petId: "pet",
        scheduleDay: 0,
        timezone: "Australia/Melbourne",
      },
      weights,
      reminders,
      new Date("2026-08-25T00:00:00.000Z"),
    );
    expect(saved.localTime).toBe("20:00");
    expect(saved.frequency).toBe("weekly");
  });
});
