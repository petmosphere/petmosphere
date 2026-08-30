import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotificationInbox } from "./notification-inbox";

const notification = {
  createdAt: "2026-08-30T02:00:00.000Z",
  id: "10000000-0000-4000-8000-000000000001",
  kind: "reminder_due" as const,
  localDate: null,
  message: "A pet care reminder is coming up.",
  petId: "20000000-0000-4000-8000-000000000002",
  readAt: null,
  reminderId: "30000000-0000-4000-8000-000000000003",
  title: "Vaccination Due",
};

describe("NotificationInbox", () => {
  it("shows unread notifications and links settings", () => {
    render(
      <NotificationInbox
        initialNotifications={[notification]}
        today="2026-08-30"
      />,
    );

    expect(screen.getByText("Unread")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Notification settings" }),
    ).toHaveAttribute("href", "/profile/notifications?from=%2Fnotifications");
    expect(
      screen.getByRole("link", { name: /Vaccination Due/ }),
    ).toHaveAttribute("href", `/reminders/${notification.reminderId}`);
  });

  it("marks all notifications read", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    render(
      <NotificationInbox
        initialNotifications={[notification]}
        today="2026-08-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    await waitFor(() =>
      expect(screen.queryByText("Unread")).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/notifications",
      expect.objectContaining({ method: "PATCH" }),
    );
    fetchMock.mockRestore();
  });

  it("shows the empty state", () => {
    render(<NotificationInbox initialNotifications={[]} today="2026-08-30" />);
    expect(screen.getByText("No notifications yet")).toBeVisible();
  });
});
