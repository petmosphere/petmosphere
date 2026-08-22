import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RemindersHome } from "./reminders-home";

const pet = {
  approximateAge: null,
  birthDate: null,
  breed: null,
  createdAt: "2026-08-22T00:00:00.000Z",
  desexedStatus: null,
  id: "73000000-0000-4000-8000-000000000003",
  name: "Max",
  ownerId: "71000000-0000-4000-8000-000000000001",
  photoPath: null,
  sex: null,
  species: "dog" as const,
  updatedAt: "2026-08-22T00:00:00.000Z",
  weightKg: null,
};

const expiredReminder = {
  category: "vet_visit" as const,
  completedAt: null,
  createdAt: "2026-08-22T00:00:00.000Z",
  dueDate: "2020-01-01",
  id: "74000000-0000-4000-8000-000000000004",
  localTime: "09:00",
  note: null,
  petId: pet.id,
  repeatRule: "never" as const,
  seriesId: "75000000-0000-4000-8000-000000000005",
  timezone: "Australia/Melbourne" as const,
  title: "Vet appointment",
  updatedAt: "2026-08-22T00:00:00.000Z",
};

describe("RemindersHome", () => {
  it("matches the personalised empty-state journey across all three tabs", () => {
    render(
      <RemindersHome
        initial={{ completed: [], overdue: [], upcoming: [] }}
        pets={[pet]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No reminders yet" }),
    ).toBeVisible();
    expect(screen.getByText(/Stay on top of Max’s health/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Add Your First Reminder/ }),
    ).toHaveAttribute("href", "/reminders/new");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Upcoming",
      "Overdue",
      "Completed",
    ]);

    fireEvent.click(screen.getByRole("tab", { name: "Completed" }));
    expect(
      screen.getByRole("heading", { name: "No completed reminders yet" }),
    ).toBeVisible();
  });

  it("moves a passed reminder from upcoming to overdue", () => {
    render(
      <RemindersHome
        initial={{
          completed: [],
          overdue: [],
          upcoming: [expiredReminder],
        }}
        pets={[pet]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No reminders yet" }),
    ).toBeVisible();
    const overdueTab = screen.getByRole("tab", {
      name: "Overdue, 1 reminder",
    });
    expect(overdueTab).toHaveTextContent("1");
    fireEvent.click(overdueTab);
    expect(screen.getByText("Vet appointment")).toBeVisible();
  });
});
