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
      screen.getByRole("heading", { name: "Overseas processing" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Access and correction" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "OAIC privacy complaints process" }),
    ).toHaveAttribute(
      "href",
      "https://www.oaic.gov.au/privacy/privacy-complaints",
    );
  });
});
