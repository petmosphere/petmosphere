import {
  CURRENT_TERMS_VERSION,
  signUpSchema,
  verifyEmailCodeSchema,
} from "@petmosphere/api-contracts";
import { getSafeNextPath } from "@petmosphere/services";
import { describe, expect, it } from "vitest";

describe("authentication foundation", () => {
  it("rejects weak and mismatched sign-up credentials", () => {
    expect(
      signUpSchema.safeParse({
        acceptedTerms: "on",
        displayName: "Alex",
        email: "owner@example.com",
        password: "short",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("requires explicit acceptance of the current Terms", () => {
    const credentials = {
      displayName: "Alex",
      email: "owner@example.com",
      password: "a-secure-password",
      confirmPassword: "a-secure-password",
    };

    expect(signUpSchema.safeParse(credentials).success).toBe(false);
    expect(
      signUpSchema.safeParse({ ...credentials, acceptedTerms: true }).success,
    ).toBe(true);
    expect(CURRENT_TERMS_VERSION).toBe("2026-08-12");
  });

  it("allows only local post-auth destinations", () => {
    expect(getSafeNextPath("/onboarding?step=policies")).toBe(
      "/onboarding?step=policies",
    );
    expect(getSafeNextPath("https://malicious.example/collect")).toBe(
      "/onboarding",
    );
    expect(getSafeNextPath("//malicious.example/collect")).toBe("/onboarding");
  });

  it("accepts only a six-digit email verification code", () => {
    expect(verifyEmailCodeSchema.safeParse({ code: "123456" }).success).toBe(
      true,
    );
    expect(verifyEmailCodeSchema.safeParse({ code: "12345" }).success).toBe(
      false,
    );
    expect(verifyEmailCodeSchema.safeParse({ code: "12345a" }).success).toBe(
      false,
    );
  });
});
