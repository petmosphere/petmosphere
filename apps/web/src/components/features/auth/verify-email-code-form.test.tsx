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
    const button = screen.getByRole("button", { name: "Verify code" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123 456" },
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "invalid or expired",
    );
    expect(verify.mock.calls[0]?.[1].get("code")).toBe("123456");
    expect(
      screen.getByRole("link", { name: "Use a different email" }),
    ).toHaveAttribute("href", "/auth/forgot-password");
  });
  it("restarts the cooldown and clears the old code after resending", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toHaveValue(""),
    );
    expect(screen.getByText("Resend available in 60s")).toBeVisible();
  });
});
