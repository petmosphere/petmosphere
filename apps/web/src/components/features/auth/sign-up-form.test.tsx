import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

vi.mock("@/app/auth/actions", () => ({
  signUpAction: vi.fn(),
}));

describe("SignUpForm", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores only non-sensitive draft fields", async () => {
    sessionStorage.setItem(
      "signup-draft",
      JSON.stringify({
        confirmPassword: "do-not-restore",
        displayName: "Pet Owner",
        email: "owner@example.com",
        password: "do-not-restore",
      }),
    );

    render(<SignUpForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Pet Owner");
      expect(screen.getByLabelText("Email address")).toHaveValue(
        "owner@example.com",
      );
    });
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm password")).toHaveValue("");
    expect(JSON.parse(sessionStorage.getItem("signup-draft") ?? "{}")).toEqual({
      displayName: "Pet Owner",
      email: "owner@example.com",
    });
  });

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

  it("accepts terms agreed in the separate terms page", async () => {
    render(<SignUpForm />);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "signup-terms-agreed",
        newValue: "true",
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", {
          name: /agree to the Terms of Service/i,
        }),
      ).toBeChecked(),
    );
  });
});
