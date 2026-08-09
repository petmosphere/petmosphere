import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the Petmosphere PWA foundation message", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Your pet's health, organised.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("PWA foundation is running successfully."),
    ).toBeInTheDocument();
  });
});
