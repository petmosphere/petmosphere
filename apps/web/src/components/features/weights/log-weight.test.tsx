import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Pet } from "@petmosphere/domain";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LogWeight } from "./log-weight";

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
  weightKg: 20,
};

describe("LogWeight", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a clear empty state without treating the profile snapshot as history", () => {
    render(<LogWeight entries={[]} pet={pet} reminder={null} />);

    expect(
      screen.getByLabelText("Max's weight in kilograms"),
    ).toHaveDisplayValue("0.0");
    expect(screen.getByText("No records yet")).toBeVisible();
    expect(screen.getByLabelText("No weight trend data yet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.queryByText("Enter a weight between 0.01 and 300 kg."),
    ).not.toBeInTheDocument();
  });

  it("enables save after the user enters a valid weight", () => {
    render(<LogWeight entries={[]} pet={pet} reminder={null} />);

    const input = screen.getByLabelText("Max's weight in kilograms");
    fireEvent.change(input, { target: { value: "1" } });
    expect(input).toHaveDisplayValue("1");
    fireEvent.change(input, { target: { value: "10" } });

    expect(input).toHaveDisplayValue("10");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("shows pounds but saves the canonical kilogram value", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        createdAt: "2026-08-25T00:00:00.000Z",
        derivationTimezone: "Australia/Melbourne",
        id: "40000000-0000-4000-8000-000000000004",
        localDate: "2026-08-25",
        petId: pet.id,
        source: "web",
        updatedAt: "2026-08-25T00:00:00.000Z",
        weightKg: 10,
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <LogWeight entries={[]} pet={pet} reminder={null} weightUnit="lb" />,
    );

    fireEvent.change(screen.getByLabelText("Max's weight in pounds"), {
      target: { value: "22.05" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
      weightKg: 10,
    });
  });
});
