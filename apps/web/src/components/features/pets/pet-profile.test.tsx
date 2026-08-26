import { fireEvent, render, screen } from "@testing-library/react";
import type { Pet } from "@petmosphere/domain";
import { describe, expect, it } from "vitest";

import { PetProfile } from "./pet-profile";

describe("PetProfile", () => {
  it("shows pet details and links to edit", () => {
    const pet: Pet = {
      approximateAge: null,
      birthDate: "2020-05-12",
      breed: "Kelpie",
      createdAt: "2026-08-15T00:00:00.000Z",
      desexedStatus: "yes",
      id: "20000000-0000-4000-8000-000000000002",
      name: "Max",
      ownerId: "30000000-0000-4000-8000-000000000003",
      photoPath: null,
      sex: "male",
      species: "dog",
      updatedAt: "2026-08-15T00:00:00.000Z",
      weightKg: 18,
    };

    render(<PetProfile pet={pet} photoUrl={null} />);

    expect(screen.getByRole("heading", { name: "Max" })).toBeVisible();
    expect(screen.getByText("Kelpie", { exact: false })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Edit Max's profile" }),
    ).toHaveAttribute("href", `/pets/${pet.id}/edit`);
    expect(screen.getByText("Weight History")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Enlarge Max's profile photo" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Max's profile photo" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Close enlarged photo" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Max's profile photo" }),
    ).not.toBeInTheDocument();
  });
});
