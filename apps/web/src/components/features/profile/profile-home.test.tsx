import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileHome } from "./profile-home";

vi.mock("@/components/features/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

const pet = {
  approximateAge: null,
  birthDate: null,
  breed: "Golden Retriever",
  createdAt: "2026-08-25T00:00:00Z",
  desexedStatus: null,
  id: "10000000-0000-4000-8000-000000000001",
  name: "Max",
  ownerId: "20000000-0000-4000-8000-000000000002",
  photoPath: null,
  sex: null,
  species: "dog" as const,
  updatedAt: "2026-08-25T00:00:00Z",
  weightKg: null,
};

describe("ProfileHome", () => {
  it("shows account, pets, preferences and support links", () => {
    render(
      <ProfileHome
        avatarUrl={null}
        displayName="Sarah Chen"
        email="sarah@example.com"
        pets={[{ pet, photoUrl: null }]}
        weightUnit="kg"
      />,
    );

    expect(screen.getByRole("heading", { name: "Profile" })).toBeVisible();
    expect(screen.getByText("Sarah Chen")).toBeVisible();
    expect(screen.getByRole("link", { name: /Max/ })).toHaveAttribute(
      "href",
      `/pets/${pet.id}`,
    );
    expect(
      screen.getByRole("link", { name: "Notification Settings" }),
    ).toHaveAttribute("href", "/profile/notifications");
    expect(screen.getByRole("link", { name: "Help & FAQ" })).toHaveAttribute(
      "href",
      "/profile/help",
    );
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/profile/privacy");
    expect(
      screen.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/profile/terms");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("prompts a pet-less user to add their first pet", () => {
    render(
      <ProfileHome
        avatarUrl={null}
        displayName="Sarah Chen"
        email="sarah@example.com"
        pets={[]}
        weightUnit="kg"
      />,
    );

    expect(
      screen.getByRole("link", { name: /Add your first pet/ }),
    ).toHaveAttribute("href", "/onboarding/pet");
  });
});
