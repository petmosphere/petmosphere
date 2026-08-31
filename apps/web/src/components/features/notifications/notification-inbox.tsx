"use client";

import type { NotificationResponse } from "@petmosphere/api-contracts";
import { deriveLocalDate } from "@petmosphere/domain";
import { ArrowLeft, Bell, Check, Heart, Scale, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppNav } from "@/components/features/pets/app-nav";

function hrefFor(notification: NotificationResponse, today: string) {
  if (notification.reminderId) return `/reminders/${notification.reminderId}`;
  if (notification.kind === "daily_check_in" && notification.petId)
    return notification.localDate === today
      ? `/pets/${notification.petId}/health-logs/today`
      : `/pets/${notification.petId}/health-logs`;
  if (notification.kind === "weight_log" && notification.petId)
    return `/pets/${notification.petId}/weight`;
  return "/notifications";
}

function relativeTime(createdAt: string, now: Date) {
  const elapsedHours = Math.max(
    0,
    Math.floor((now.getTime() - new Date(createdAt).getTime()) / 3_600_000),
  );
  if (elapsedHours < 1) return "Just now";
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) return "Yesterday";
  return `${elapsedDays}d ago`;
}

const details = {
  daily_check_in: { Icon: Heart, colour: "text-[#55aaa5] border-[#65bcb5]" },
  reminder_completed: {
    Icon: Check,
    colour: "text-[#55aaa5] border-[#65bcb5]",
  },
  reminder_due: { Icon: Bell, colour: "text-[#ed802a] border-[#ed802a]" },
  weight_log: { Icon: Scale, colour: "text-[#ed802a] border-[#ed802a]" },
} as const;

export function NotificationInbox({
  backHref = "/home",
  diaryHref,
  initialNotifications,
  reminderHref,
  today,
}: {
  backHref?: string;
  diaryHref?: string | undefined;
  initialNotifications: NotificationResponse[];
  reminderHref?: string | undefined;
  today: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const now = new Date();
  const todayNotifications = notifications.filter(
    ({ createdAt }) =>
      deriveLocalDate(new Date(createdAt), "Australia/Melbourne") === today,
  );
  const earlierNotifications = notifications.filter(
    ({ createdAt }) =>
      deriveLocalDate(new Date(createdAt), "Australia/Melbourne") !== today,
  );
  const hasUnread = notifications.some(({ readAt }) => !readAt);

  async function markAllRead() {
    if (!hasUnread || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/notifications", {
        body: JSON.stringify({ all: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) throw new Error();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, readAt })),
      );
    } catch {
      setMessage("We could not mark notifications as read. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function markRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, readAt: new Date().toISOString() }
          : notification,
      ),
    );
    void fetch("/api/v1/notifications", {
      body: JSON.stringify({ notificationId }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
  }

  function group(label: string, items: NotificationResponse[]) {
    if (items.length === 0) return null;
    return (
      <section className="mt-7" aria-labelledby={`notifications-${label}`}>
        <h2
          className="text-xs font-bold tracking-[0.12em] text-[#98918b] uppercase"
          id={`notifications-${label}`}
        >
          {label}
        </h2>
        <div className="mt-4 space-y-3">
          {items.map((notification) => {
            const { Icon, colour } = details[notification.kind];
            const unread = !notification.readAt;
            return (
              <Link
                className="flex min-h-28 items-center gap-3 rounded-2xl border border-[#eedbc4] bg-white/65 px-4 py-4 shadow-[0_8px_24px_rgba(205,146,85,0.05)] transition-transform focus-visible:outline-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
                href={hrefFor(notification, today)}
                key={notification.id}
                onClick={() => unread && markRead(notification.id)}
              >
                <span className="flex size-3 shrink-0 items-center justify-center">
                  {unread ? (
                    <span className="size-2 rounded-full bg-[#ed802a]">
                      <span className="sr-only">Unread</span>
                    </span>
                  ) : null}
                </span>
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-full border ${colour}`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm ${unread ? "font-bold" : "font-semibold"}`}
                  >
                    {notification.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#7a7a7a]">
                    {notification.message}
                  </span>
                </span>
                <span className="shrink-0 self-center text-[11px] text-[#9a958f]">
                  {relativeTime(notification.createdAt, now)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-24 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex min-h-12 items-center gap-3">
        <Link
          aria-label={backHref === "/home" ? "Back to home" : "Back"}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[#eedbc4] bg-white/45 focus-visible:outline-2 focus-visible:outline-[#ed802a]"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 text-2xl font-bold">Notifications</h1>
        <button
          className="min-h-11 shrink-0 text-sm font-semibold text-[#ed802a] disabled:text-[#aaa39c]"
          disabled={!hasUnread || busy}
          onClick={() => void markAllRead()}
          type="button"
        >
          Mark all read
        </button>
        <Link
          aria-label="Notification settings"
          className="grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
          href="/profile/notifications?from=%2Fnotifications"
        >
          <Settings aria-hidden="true" className="size-6" />
        </Link>
      </header>

      {message ? (
        <p
          className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <span className="grid size-24 place-items-center rounded-full border-2 border-dashed border-[#ed802a] text-[#ed802a]">
            <Bell aria-hidden="true" className="size-9" />
          </span>
          <h2 className="mt-6 text-xl font-bold">No notifications yet</h2>
          <p className="mt-2 text-sm leading-5 text-[#7a7a7a]">
            Updates about reminders and everyday care will appear here.
          </p>
        </section>
      ) : (
        <div className="pb-8">
          {group("Today", todayNotifications)}
          {group("Earlier", earlierNotifications)}
        </div>
      )}

      <AppNav
        active="home"
        diaryHref={diaryHref}
        fixed
        reminderHref={reminderHref}
      />
    </main>
  );
}
