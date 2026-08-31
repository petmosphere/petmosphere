import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      className="relative grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
      href="/notifications"
    >
      <Bell aria-hidden="true" className="size-6" strokeWidth={1.8} />
      {unreadCount > 0 ? (
        <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full border-2 border-[#fdf8f2] bg-red-500" />
      ) : null}
    </Link>
  );
}
