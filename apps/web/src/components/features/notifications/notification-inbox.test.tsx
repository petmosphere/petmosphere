import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));

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
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_url, options) =>
        new Response(
          JSON.stringify(
            options?.method === "PATCH"
              ? { ok: true }
              : { notifications: [notification], unreadCount: 1 },
          ),
          { status: 200 },
        ),
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows unread notifications and links settings", () => {
    render(
      <NotificationInbox
        initialNow="2026-08-30T02:03:00.000Z"
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
    expect(screen.getByText("3 mins ago")).toBeVisible();
  });

  it("marks all notifications read", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    render(
      <NotificationInbox
        initialNow="2026-08-30T02:03:00.000Z"
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
  });

  it("keeps marking a clicked notification read during navigation", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    render(
      <NotificationInbox
        initialNow="2026-08-30T02:03:00.000Z"
        initialNotifications={[notification]}
        today="2026-08-30"
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: /Vaccination Due/ }));

    expect(screen.queryByText("Unread")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/notifications",
        expect.objectContaining({ keepalive: true, method: "PATCH" }),
      ),
    );
  });

  it("refreshes a cached unread notification when returning to the inbox", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const props = {
      initialNow: "2026-08-30T02:03:00.000Z",
      initialNotifications: [notification],
      today: "2026-08-30",
    };
    const firstVisit = render(<NotificationInbox {...props} />);
    fireEvent.click(screen.getByRole("link", { name: /Vaccination Due/ }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/notifications",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    firstVisit.unmount();
    fetchMock.mockImplementation(
      async (_url, options) =>
        new Response(
          JSON.stringify(
            options?.method === "PATCH"
              ? { ok: true }
              : {
                  notifications: [
                    { ...notification, readAt: "2026-08-30T02:03:30.000Z" },
                  ],
                  unreadCount: 0,
                },
          ),
          { status: 200 },
        ),
    );
    render(<NotificationInbox {...props} />);
    await waitFor(() =>
      expect(screen.queryByText("Unread")).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/notifications",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("does not restore unread state from a stale refresh after tapping a notification", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    let finishRefresh!: (response: Response) => void;
    fetchMock.mockImplementation(async (_url, options) => {
      if (options?.method === "PATCH")
        return new Response(JSON.stringify({ ok: true }));
      return new Promise<Response>((resolve) => {
        finishRefresh = resolve;
      });
    });
    render(
      <NotificationInbox
        initialNow="2026-08-30T02:03:00.000Z"
        initialNotifications={[notification]}
        today="2026-08-30"
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: /Vaccination Due/ }));
    await act(async () => {
      finishRefresh(
        new Response(
          JSON.stringify({ notifications: [notification], unreadCount: 1 }),
        ),
      );
    });
    expect(screen.queryByText("Unread")).not.toBeInTheDocument();
  });

  it("shows the empty state", () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ notifications: [], unreadCount: 0 })),
    );
    render(
      <NotificationInbox
        initialNow="2026-08-30T02:03:00.000Z"
        initialNotifications={[]}
        today="2026-08-30"
      />,
    );
    expect(screen.getByText("No notifications yet")).toBeVisible();
  });
});
