import { render, screen } from "@testing-library/react";
import type { Pet } from "@petmosphere/domain";
import { describe, expect, it } from "vitest";

import { PetsHome } from "./pets-home";

const pet: Pet = {
  approximateAge: "adult",
  birthDate: null,
  breed: "Kelpie",
  createdAt: "2026-08-01T00:00:00.000Z",
  desexedStatus: "yes",
  id: "30000000-0000-4000-8000-000000000003",
  name: "Max",
  ownerId: "20000000-0000-4000-8000-000000000002",
  photoPath: null,
  sex: "male",
  species: "dog",
  updatedAt: "2026-08-01T00:00:00.000Z",
  weightKg: 18,
};

describe("PetsHome", () => {
  it("highlights today's emotion and shows reminders and recent records", () => {
    render(
      <PetsHome
        displayName="Sarah"
        healthLogs={[
          {
            id: "10000000-0000-4000-8000-000000000001",
            localDate: "2026-08-16",
            observations: ["low_energy", "soft_poop"],
            status: "something_different",
          },
          {
            id: "10000000-0000-4000-8000-000000000002",
            localDate: "2026-08-15",
            observations: ["playful"],
            status: "doing_well",
          },
        ]}
        pets={[{ pet, photoUrl: null }]}
        reminder={{ enabled: true, localTime: "19:00" }}
        today="2026-08-16"
      />,
    );

    expect(screen.getByText(/selected today/)).toBeInTheDocument();
    expect(screen.getByText("Reminder at 7:00 pm")).toBeVisible();
    expect(screen.getByText("Low energy")).toBeVisible();
    expect(screen.getByText("Playful")).toBeVisible();
  });

  it("shows empty states when no records or reminder exist", () => {
    render(
      <PetsHome
        displayName="Sarah"
        healthLogs={[]}
        pets={[{ pet, photoUrl: null }]}
        reminder={null}
        today="2026-08-16"
      />,
    );

    expect(screen.getAllByText("No record yet")).toHaveLength(2);
    expect(screen.queryByText(/selected today/)).not.toBeInTheDocument();
  });
});
