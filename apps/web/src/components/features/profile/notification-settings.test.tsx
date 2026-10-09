import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({
    replace,
    ...props
  }: ComponentProps<"a"> & { replace?: boolean }) => (
    <a data-replace={replace ? "true" : "false"} {...props} />
  ),
}));

import { NotificationSettings } from "./notification-settings";
import { enablePushNotifications } from "@/lib/health-logs/push-notifications";

vi.mock("@/lib/health-logs/push-notifications", () => ({
  disablePushNotifications: vi.fn(),
  enablePushNotifications: vi.fn(async () => ({ ok: true })),
  isCurrentPushSubscription: vi.fn(() => true),
  pushSetupErrorMessages: {},
}));

const pets = [
  {
    healthReminder: {
      enabled: true,
      localTime: "19:00",
      timezone: "Australia/Melbourne",
    },
    id: "10000000-0000-4000-8000-000000000001",
    name: "Max",
    weightReminder: {
      enabled: true,
      frequency: "fortnightly" as const,
      localTime: "20:00",
      scheduleDay: 0,
      timezone: "Australia/Melbourne",
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
    render(<NotificationSettings pets={pets} reminderNotificationsEnabled />);

    expect(
      screen.getByRole("heading", { name: "Notification Settings" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("switch", {
          name: "Push notifications on this device",
        }),
      ).toHaveAttribute("aria-checked", "true"),
    );
    expect(enablePushNotifications).toHaveBeenCalledOnce();
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
    ).toHaveAttribute("data-replace", "true");
  });

  it("shows setup actions until feature schedules exist", async () => {
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

    await waitFor(() =>
      expect(
        screen.getByRole("switch", {
          name: "Push notifications on this device",
        }),
      ).toHaveAttribute("aria-checked", "true"),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Set up Daily check-in" }),
    );
    expect(
      screen.getByRole("heading", { name: "Set Reminder Time" }),
    ).toBeVisible();
  });

  it("keeps inbox category controls enabled when device push is off", async () => {
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValueOnce({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
      },
    } as unknown as ServiceWorkerRegistration);

    render(<NotificationSettings pets={pets} reminderNotificationsEnabled />);

    await waitFor(() =>
      expect(
        screen.getByRole("switch", {
          name: "Push notifications on this device",
        }),
      ).toHaveAttribute("aria-checked", "false"),
    );
    expect(
      screen.getByRole("switch", { name: "Daily check-in" }),
    ).toBeEnabled();
    expect(screen.getByRole("switch", { name: "Reminders" })).toBeEnabled();
    expect(screen.getByRole("switch", { name: "Weight log" })).toBeEnabled();
    expect(
      screen.getByText(
        "Push is off on this device. Enabled categories will still appear in your inbox.",
      ),
    ).toBeVisible();
  });
});
