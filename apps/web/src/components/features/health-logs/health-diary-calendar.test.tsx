import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HealthDiaryCalendar } from "./health-diary-calendar";

describe("HealthDiaryCalendar", () => {
  it("identifies the pet whose diary is shown", () => {
    render(
      <HealthDiaryCalendar
        logs={[]}
        month="2026-09"
        onAddToday={vi.fn()}
        onMonthChange={vi.fn()}
        onSelectDate={vi.fn()}
        petName="Max"
        today="2026-09-06"
      />,
    );

    expect(
      screen.getByRole("region", {
        name: "Health diary calendar for Max",
      }),
    ).toBeVisible();
    expect(screen.getByText("For Max")).toBeVisible();
  });
});
