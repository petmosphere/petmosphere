import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FirstPetForm } from "./first-pet-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

describe("FirstPetForm", () => {
  it("requires a name and species before opening optional details", async () => {
    render(<FirstPetForm />);

    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Pet’s name/), {
      target: { value: "Max" },
    });
    expect(next).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    expect(next).toBeEnabled();
    fireEvent.click(next);

    expect(
      await screen.findByRole("heading", { name: "A bit more about Max" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Male" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows an inline error for a future birth date", async () => {
    render(<FirstPetForm />);
    fireEvent.change(screen.getByLabelText(/Pet’s name/), {
      target: { value: "Max" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(await screen.findByLabelText(/Date of birth/), {
      target: { value: "2999-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      await screen.findByText("Date of birth cannot be in the future."),
    ).toBeVisible();
  });
});
