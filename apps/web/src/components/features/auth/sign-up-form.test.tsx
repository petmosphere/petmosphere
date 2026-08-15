import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

vi.mock("@/app/auth/actions", () => ({
  signUpAction: vi.fn(),
}));

describe("SignUpForm", () => {
  it("explains a password mismatch and clears the warning when corrected", () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secure-password" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "different-password" },
    });

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "secure-password" },
    });

    expect(
      screen.queryByText("Passwords do not match."),
    ).not.toBeInTheDocument();
  });
});
