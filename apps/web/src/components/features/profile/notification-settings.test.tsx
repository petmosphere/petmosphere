import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationSettings } from "./notification-settings";

vi.mock("@/lib/health-logs/push-notifications", () => ({
  disablePushNotifications: vi.fn(),
  enablePushNotifications: vi.fn(),
  pushSetupErrorMessages: {},
}));

const pets = [
  {
    healthReminder: { enabled: true, localTime: "19:00" },
    id: "10000000-0000-4000-8000-000000000001",
    name: "Max",
    weightReminder: {
      enabled: true,
      frequency: "fortnightly" as const,
      localTime: "20:00",
      scheduleDay: 0,
    },
  },
];

describe("NotificationSettings", () => {
  beforeEach(() => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue({ endpoint: "push" }),
          },
        }),
      },
    });
  });

  it("shows the saved notification controls and designed time sheet", async () => {
    render(
      <NotificationSettings
        alertLeadDays={1}
        pets={pets}
        reminderNotificationsEnabled
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Notification Settings" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "All notifications" }),
      ).toHaveAttribute("aria-checked", "true"),
    );
    expect(screen.getByText("1 day before")).toBeVisible();
    expect(screen.getByText("Every 2 weeks")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Time: 7:00 PM" }));
    expect(
      screen.getByRole("heading", { name: "Set Reminder Time" }),
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Hour" })).toHaveValue("7");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeVisible();
  });
});
