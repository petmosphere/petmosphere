import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VerifyEmailCodeForm } from "./verify-email-code-form";

const { verify, resend } = vi.hoisted(() => ({
  verify: vi.fn(),
  resend: vi.fn(),
}));
vi.mock("@/app/auth/actions", () => ({
  verifyRecoveryCodeAction: verify,
  resendRecoveryCodeAction: resend,
  verifyEmailCodeAction: vi.fn(),
  resendVerificationCodeAction: vi.fn(),
}));

describe("recovery code form", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("accepts pasted digits and displays verification failures", async () => {
    verify.mockResolvedValue({
      status: "error",
      message: "That code is invalid or expired.",
    });
    render(
      <VerifyEmailCodeForm
        purpose="recovery"
        maskedEmail="ow•••@example.com"
        initialResendWait={60}
        resendCooldown={60}
      />,
    );
    // Six digits auto-submit without pressing the button.
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123 456" },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "invalid or expired",
    );
    expect(verify.mock.calls[0]?.[1].get("code")).toBe("123456");
    expect(
      screen.getByRole("link", { name: "Use a different email" }),
    ).toHaveAttribute("href", "/auth/forgot-password");
  });
  it("restarts the cooldown and clears the old code after resending", async () => {
    // Entering six digits auto-submits, so verify needs a resolved state.
    verify.mockResolvedValue({ status: "idle" });
    resend.mockResolvedValue({
      status: "success",
      message: "A new code is on its way.",
    });
    render(
      <VerifyEmailCodeForm
        purpose="recovery"
        maskedEmail="ow•••@example.com"
        initialResendWait={0}
        resendCooldown={60}
      />,
    );
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    // Wait for the auto-submit to finish so Resend is clickable.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toHaveValue(""),
    );
    expect(screen.getByText("Resend available in 60s")).toBeVisible();
  });
});
