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

  it("shows saved notification controls without schedule editors", async () => {
    render(
      <NotificationSettings
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
    expect(screen.getByText("Daily check-in notifications")).toBeVisible();
    expect(screen.getByText("Weight log notifications")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Manage:/ }),
    ).not.toBeInTheDocument();
  });

  it("returns to the notifications inbox when opened from it", () => {
    render(
      <NotificationSettings
        backHref="/notifications"
        pets={[]}
        reminderNotificationsEnabled
      />,
    );

    expect(
      screen.getByRole("link", { name: "Back to notifications" }),
    ).toHaveAttribute("href", "/notifications");
  });

  it("shows setup actions until feature schedules exist", () => {
    render(
      <NotificationSettings
        pets={[
          {
            healthReminder: null,
            id: "10000000-0000-4000-8000-000000000001",
            name: "Max",
            weightReminder: null,
          },
        ]}
        reminderNotificationsEnabled
      />,
    );

    expect(
      screen.getByRole("button", { name: "Set up Daily check-in" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Set up Weight log" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Manage:/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Set up Daily check-in" }),
    );
    expect(
      screen.getByRole("heading", { name: "Set Reminder Time" }),
    ).toBeVisible();
  });
});
