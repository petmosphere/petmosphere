import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthLogReminderSettings } from "./health-log-reminder-settings";

vi.mock("@/lib/health-logs/push-notifications", () => ({
  enablePushNotifications: vi.fn().mockResolvedValue({ ok: true }),
  pushSetupErrorMessages: {},
}));

const savedReminder = { enabled: true, localTime: "20:00" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HealthLogReminderSettings", () => {
  it("collapses a saved reminder and exposes an edit action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(savedReminder)),
    );

    render(<HealthLogReminderSettings petId="pet-1" />);

    const editButton = await screen.findByRole("button", {
      name: "Edit daily check-in notification",
    });
    expect(editButton).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Save reminder" }),
    ).not.toBeInTheDocument();

    fireEvent.click(editButton);
    expect(screen.getByRole("button", { name: "Save reminder" })).toBeVisible();
  });

  it("starts collapsed when no reminder is saved, opens on click, collapses after save", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(null))
      .mockResolvedValueOnce(Response.json(savedReminder));
    vi.stubGlobal("fetch", fetchMock);

    render(<HealthLogReminderSettings petId="pet-1" />);

    // No reminder saved → collapsed with "Set up" button, no save form
    const setupButton = await screen.findByRole("button", {
      name: "Edit daily check-in notification",
    });
    expect(setupButton).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Save reminder" }),
    ).not.toBeInTheDocument();

    // Click to open editor
    fireEvent.click(setupButton);
    expect(screen.getByRole("button", { name: "Save reminder" })).toBeVisible();

    // Save → collapses back
    fireEvent.click(screen.getByRole("button", { name: "Save reminder" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Edit daily check-in notification" }),
      ).toBeVisible(),
    );
    expect(
      screen.queryByRole("button", { name: "Save reminder" }),
    ).not.toBeInTheDocument();
  });
});
