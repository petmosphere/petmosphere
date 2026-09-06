import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthLogForm } from "./health-log-form";

const pet = {
  approximateAge: null,
  birthDate: null,
  breed: null,
  createdAt: "2026-08-15T00:00:00.000Z",
  desexedStatus: null,
  id: "30000000-0000-4000-8000-000000000003",
  name: "Max",
  ownerId: "20000000-0000-4000-8000-000000000002",
  photoPath: null,
  sex: null,
  species: "dog" as const,
  updatedAt: "2026-08-15T00:00:00.000Z",
  weightKg: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HealthLogForm", () => {
  it("keeps save disabled until a wellbeing status is selected", () => {
    render(
      <HealthLogForm
        existing={null}
        initialDate="2026-08-15"
        onCancel={vi.fn()}
        onConflict={vi.fn()}
        onPetChange={vi.fn()}
        onSaved={vi.fn()}
        petOptions={[{ pet, photoUrl: null }]}
        selectedPetId={pet.id}
      />,
    );

    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Great" }));
    expect(save).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ate well" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Enjoyed walk" })).toBeVisible();
    expect(screen.getByText("Add photos")).toBeVisible();
    expect(screen.getByPlaceholderText("Add a note…")).toBeVisible();
  });

  it("preserves the note after a recoverable save failure", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input.toString().includes("health-log-events")) {
        return new Response(null, { status: 204 });
      }
      return Response.json(
        { message: "Temporary save failure. Please retry." },
        { status: 503 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HealthLogForm
        existing={null}
        initialDate="2026-08-15"
        onCancel={vi.fn()}
        onConflict={vi.fn()}
        onPetChange={vi.fn()}
        onSaved={vi.fn()}
        petOptions={[{ pet, photoUrl: null }]}
        selectedPetId={pet.id}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Okay" }));
    const note = screen.getByLabelText(/Add a note/);
    fireEvent.change(note, {
      target: { value: "Max was quieter after lunch." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Temporary save failure. Please retry."),
    ).toBeVisible();
    expect(note).toHaveValue("Max was quieter after lunch.");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it("lets a user choose another owned pet for a new entry", () => {
    const onPetChange = vi.fn();
    const luna = {
      ...pet,
      id: "40000000-0000-4000-8000-000000000004",
      name: "Luna",
    };

    render(
      <HealthLogForm
        existing={null}
        initialDate="2026-08-15"
        onCancel={vi.fn()}
        onConflict={vi.fn()}
        onPetChange={onPetChange}
        onSaved={vi.fn()}
        petOptions={[
          { pet, photoUrl: null },
          { pet: luna, photoUrl: null },
        ]}
        selectedPetId={pet.id}
      />,
    );

    fireEvent.change(screen.getByLabelText("Pet"), {
      target: { value: luna.id },
    });

    expect(onPetChange).toHaveBeenCalledWith(luna.id);
  });
});
