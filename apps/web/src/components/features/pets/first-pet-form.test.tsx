import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FirstPetForm } from "./first-pet-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

describe("FirstPetForm", () => {
  it("renders all fields on a single page and disables Done without required fields", () => {
    render(<FirstPetForm />);

    expect(
      screen.getByRole("heading", { name: "Let's meet your pet!" }),
    ).toBeVisible();
    expect(screen.getByLabelText(/Pet's name/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dog" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of birth/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("shows an inline error for a future birth date", async () => {
    render(<FirstPetForm />);

    fireEvent.change(screen.getByLabelText(/Pet's name/), {
      target: { value: "Max" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    fireEvent.change(screen.getByLabelText(/Date of birth/), {
      target: { value: "01/01/2999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      await screen.findByText("Date of birth cannot be in the future."),
    ).toBeVisible();
  });
});
