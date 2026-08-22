import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Pet } from "@petmosphere/domain";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditPetForm } from "./edit-pet-form";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace }),
}));

beforeEach(() => replace.mockClear());
afterEach(() => vi.unstubAllGlobals());

describe("EditPetForm", () => {
  it("prefills and updates an existing pet", async () => {
    const pet: Pet = {
      approximateAge: "adult",
      birthDate: null,
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
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({}),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EditPetForm pet={pet} photoUrl={null} />);
    expect(screen.getByLabelText("Pet’s name")).toHaveValue("Max");
    expect(screen.getByRole("button", { name: "Male" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.change(screen.getByLabelText("Pet’s name"), {
      target: { value: "Maxwell" },
    });
    const save = screen.getByRole("button", { name: "Save" });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/v1/pets/${pet.id}`,
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    expect(replace).toHaveBeenCalledWith(`/pets/${pet.id}`);
  });
});
