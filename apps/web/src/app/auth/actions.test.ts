import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgotPasswordAction,
  resetPasswordAction,
  verifyRecoveryCodeAction,
  resendRecoveryCodeAction,
} from "@/app/auth/actions";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => ({ value: cookieStore.get(name) }),
    set: (name: string, value: string) => cookieStore.set(name, value),
  }),
}));

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
    cookieStore.clear();
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
      message: "We could not send the recovery email. Wait and try again.",
    });
  });

  it("sends recovery users to code entry and retains a legacy callback fallback", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { resetPasswordForEmail },
    });
    const formData = new FormData();
    formData.set("email", "owner@example.com");

    await forgotPasswordAction({ status: "idle" }, formData);

    expect(resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", {
      redirectTo:
        "http://localhost:3000/auth/callback?next=/auth/reset-password",
    });
    expect(redirectMock).toHaveBeenCalledWith("/auth/verify-recovery");
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
      message: "Your recovery session has expired. Request a new code.",
    });
  });

  it("verifies recovery OTP without a PKCE callback and consumes pending state", async () => {
    cookieStore.set(
      "petmosphere_pending_sign_up_email_recovery",
      "owner@example.com",
    );
    const verifyOtp = vi
      .fn()
      .mockResolvedValue({ data: { session: {} }, error: null });
    createClientMock.mockResolvedValue({ auth: { verifyOtp } });
    const form = new FormData();
    form.set("code", "123456");
    await verifyRecoveryCodeAction({ status: "idle" }, form);
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "owner@example.com",
      token: "123456",
      type: "recovery",
    });
    expect(redirectMock).toHaveBeenCalledWith("/auth/reset-password");
    expect(cookieStore.get("petmosphere_pending_sign_up_email_recovery")).toBe(
      "",
    );
  });

  it("does not call auth for malformed codes or missing recovery state", async () => {
    const form = new FormData();
    form.set("code", "12345");
    expect(
      (await verifyRecoveryCodeAction({ status: "idle" }, form)).status,
    ).toBe("error");
    form.set("code", "123456");
    expect(
      (await verifyRecoveryCodeAction({ status: "idle" }, form)).status,
    ).toBe("error");
    expect((await resendRecoveryCodeAction()).status).toBe("error");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("allows retry after a resend provider failure", async () => {
    cookieStore.set(
      "petmosphere_pending_sign_up_email_recovery",
      "owner@example.com",
    );
    const send = vi
      .fn()
      .mockResolvedValueOnce({ error: new Error("private SMTP details") })
      .mockResolvedValueOnce({ error: null });
    createClientMock.mockResolvedValue({
      auth: { resetPasswordForEmail: send },
    });
    expect(await resendRecoveryCodeAction()).toEqual({
      status: "error",
      message: "We could not send the recovery code. Wait and try again.",
    });
    expect((await resendRecoveryCodeAction()).status).toBe("success");
  });

  it("rejects invalid or expired codes without exposing provider errors", async () => {
    cookieStore.set(
      "petmosphere_pending_sign_up_email_recovery",
      "owner@example.com",
    );
    createClientMock.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: { session: null },
          error: new Error("private"),
        }),
      },
    });
    const form = new FormData();
    form.set("code", "123456");
    expect(
      (await verifyRecoveryCodeAction({ status: "idle" }, form)).status,
    ).toBe("error");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("enforces resend cooldown then permits another recovery email", async () => {
    cookieStore.set(
      "petmosphere_pending_sign_up_email_recovery",
      "owner@example.com",
    );
    cookieStore.set(
      "petmosphere_verification_code_sent_at_recovery",
      String(Date.now()),
    );
    expect((await resendRecoveryCodeAction()).status).toBe("error");
    expect(createClientMock).not.toHaveBeenCalled();
    cookieStore.set(
      "petmosphere_verification_code_sent_at_recovery",
      String(Date.now() - 61000),
    );
    const send = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: { resetPasswordForEmail: send },
    });
    expect((await resendRecoveryCodeAction()).status).toBe("success");
    expect(send).toHaveBeenCalledWith("owner@example.com");
    expect((await resendRecoveryCodeAction()).status).toBe("error");
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
