import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("guides visitors through the product introduction to sign-up", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Track your pet’s wellness in 10 seconds a day",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip" })).toHaveAttribute(
      "href",
      "/auth/sign-up",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("heading", {
        name: "Never miss a vaccination or vet visit",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("heading", { name: "Made for Aussie pets" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Started" })).toHaveAttribute(
      "href",
      "/auth/sign-up",
    );
  });
});
