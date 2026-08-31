import {
  listNotifications,
  markAllNotificationsRead,
  type NotificationRepository,
} from "@petmosphere/services";
import { describe, expect, it, vi } from "vitest";

function repository(): NotificationRepository {
  return {
    countUnread: vi.fn().mockResolvedValue(1),
    list: vi.fn().mockResolvedValue([]),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    markRead: vi.fn().mockResolvedValue(undefined),
  };
}

describe("notification management", () => {
  it("lists only the 60-day visible window", async () => {
    const store = repository();
    const now = new Date("2026-08-30T10:00:00.000Z");

    await expect(listNotifications("owner", store, now)).resolves.toEqual({
      notifications: [],
      unreadCount: 1,
    });
    expect(store.list).toHaveBeenCalledWith(
      "owner",
      new Date("2026-07-01T10:00:00.000Z"),
    );
  });

  it("marks all retained notifications read", async () => {
    const store = repository();
    const now = new Date("2026-08-30T10:00:00.000Z");

    await markAllNotificationsRead("owner", store, now);

    expect(store.markAllRead).toHaveBeenCalledWith("owner", now);
  });
});
