import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgotPasswordAction, resetPasswordAction } from "@/app/auth/actions";

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/config", () => ({
  getAppUrl: () => "http://localhost:3000",
  getPublicConfigurationError: () => null,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("password recovery actions", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    redirectMock.mockReset();
  });

  it("reports email-provider failures without exposing provider details", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({
          error: new Error("private SMTP details"),
        }),
      },
    });
    const formData = new FormData();
    formData.set("email", "owner@example.com");

    await expect(
      forgotPasswordAction({ status: "idle" }, formData),
    ).resolves.toEqual({
      status: "error",
      message: "We could not send the reset email. Wait and try again.",
    });
  });

  it("rejects an expired recovery session", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("expired session"),
        }),
      },
    });
    const formData = new FormData();
    formData.set("password", "new-secure-password");
    formData.set("confirmPassword", "new-secure-password");

    await expect(
      resetPasswordAction({ status: "idle" }, formData),
    ).resolves.toEqual({
      status: "error",
      message: "This reset link has expired. Request a new one.",
    });
  });

  it("updates the password and sends the user back to sign in", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null,
        }),
        updateUser,
      },
    });
    const formData = new FormData();
    formData.set("password", "new-secure-password");
    formData.set("confirmPassword", "new-secure-password");

    await resetPasswordAction({ status: "idle" }, formData);

    expect(updateUser).toHaveBeenCalledWith({
      password: "new-secure-password",
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/sign-in?notice=password-updated",
    );
  });
});
