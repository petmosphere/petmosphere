import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyContent } from "./privacy-policy-content";

describe("PrivacyPolicyContent", () => {
  it("covers collection, overseas processing, user rights and complaints", () => {
    render(<PrivacyPolicyContent />);

    expect(
      screen.getByRole("heading", { name: "Information we collect" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Data location and overseas processing",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Access, correction and portability",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "info.petmosphere@gmail.com" }),
    ).toHaveAttribute("href", "mailto:info.petmosphere@gmail.com");
  });
});
