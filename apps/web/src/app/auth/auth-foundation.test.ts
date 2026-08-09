import { signUpSchema } from "@petmosphere/api-contracts";
import { getSafeNextPath } from "@petmosphere/services";
import { describe, expect, it } from "vitest";

describe("authentication foundation", () => {
  it("rejects weak and mismatched sign-up credentials", () => {
    expect(
      signUpSchema.safeParse({
        email: "owner@example.com",
        password: "short",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
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
});
