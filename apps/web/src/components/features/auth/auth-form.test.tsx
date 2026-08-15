import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

describe("AuthForm password recovery", () => {
  it("lets a returning user reveal and hide their password", () => {
    render(
      <AuthForm
        action={vi.fn()}
        fields={[
          {
            autoComplete: "email",
            label: "Email address",
            name: "email",
            type: "email",
          },
          {
            autoComplete: "current-password",
            label: "Password",
            name: "password",
            type: "password",
          },
        ]}
        submitLabel="Log in"
        variant="sign-in"
      />,
    );

    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("shows a reset-password mismatch before submission", async () => {
    render(
      <AuthForm
        action={vi.fn()}
        fields={[
          {
            autoComplete: "new-password",
            label: "New password",
            name: "password",
            type: "password",
          },
          {
            autoComplete: "new-password",
            label: "Confirm new password",
            name: "confirmPassword",
            type: "password",
          },
        ]}
        submitLabel="Update password"
        variant="reset"
      />,
    );

    fireEvent.change(screen.getByLabelText(/^New password/), {
      target: { value: "new-secure-password" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password/), {
      target: { value: "different-password" },
    });

    expect(await screen.findByText("Passwords do not match.")).toBeVisible();
    expect(screen.getByLabelText(/^Confirm new password/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Update password" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Confirm new password/), {
      target: { value: "new-secure-password" },
    });

    await waitFor(() =>
      expect(screen.queryByText("Passwords do not match.")).toBeNull(),
    );
    expect(
      screen.getByRole("button", { name: "Update password" }),
    ).toBeEnabled();
  });

  it("shows a non-enumerating reset-request confirmation", async () => {
    const action = vi.fn().mockResolvedValue({
      status: "success",
      message: "If an account exists, a password reset link is on its way.",
    });
    render(
      <AuthForm
        action={action}
        fields={[
          {
            autoComplete: "email",
            label: "Email address",
            name: "email",
            type: "email",
          },
        ]}
        submitLabel="Send reset link"
        variant="forgot"
      />,
    );

    const submit = screen.getByRole("button", { name: "Send reset link" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Email address/), {
      target: { value: "owner@example.com" },
    });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(
      await screen.findByText(
        "If an account exists, a password reset link is on its way.",
      ),
    ).toHaveAttribute("role", "status");
    expect(action).toHaveBeenCalledOnce();
    expect(submit).toBeDisabled();
  });
});
