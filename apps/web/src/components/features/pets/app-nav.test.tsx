import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppNav } from "./app-nav";

describe("AppNav", () => {
  it("uses Profile instead of a separate Settings destination", () => {
    render(
      <AppNav diaryHref="/pets/pet-1/health-logs" profileHref="/pets/pet-1" />,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Diary")).toBeVisible();
    expect(screen.getByText("Reminders")).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/pets/pet-1",
    );
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });
});
