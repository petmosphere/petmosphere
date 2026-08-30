import { Bell, CalendarDays, ContactRound, House } from "lucide-react";
import Link from "next/link";

const itemClass =
  "flex min-h-12 flex-col items-center justify-center rounded-full text-[10px] leading-3 font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]";

export function AppNav({
  active = "home",
  diaryHref,
  fixed = false,
  reminderHref,
}: {
  active?: "diary" | "home" | "profile" | "reminders";
  diaryHref?: string | undefined;
  fixed?: boolean;
  reminderHref?: string | undefined;
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className={`${
        fixed
          ? "fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 w-[calc(100%_-_2rem)] max-w-[361px] -translate-x-1/2"
          : "sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] mx-4 mt-auto"
      } z-40 grid grid-cols-4 rounded-full border border-white/50 bg-[rgba(248,239,227,0.92)] p-1.5 shadow-[0_8px_24px_rgba(75,55,35,0.12)] backdrop-blur-xl`}
    >
      <Link
        aria-current={active === "home" ? "page" : undefined}
        className={`${itemClass} ${
          active === "home" ? "bg-white/85 text-[#ed802a]" : "text-[#7a7a7a]"
        }`}
        href="/home"
      >
        <House aria-hidden="true" className="mb-0.5 size-5" strokeWidth={1.8} />
        Home
      </Link>
      {diaryHref ? (
        <Link
          aria-current={active === "diary" ? "page" : undefined}
          className={`${itemClass} ${
            active === "diary" ? "bg-white/85 text-[#ed802a]" : "text-[#7a7a7a]"
          }`}
          href={diaryHref}
        >
          <CalendarDays
            aria-hidden="true"
            className="mb-0.5 size-5"
            strokeWidth={1.8}
          />
          Diary
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${itemClass} cursor-default text-[#c4c4c4]`}
        >
          <CalendarDays
            aria-hidden="true"
            className="mb-0.5 size-5"
            strokeWidth={1.7}
          />
          Diary
        </span>
      )}
      {reminderHref ? (
        <Link
          aria-current={active === "reminders" ? "page" : undefined}
          className={`${itemClass} ${
            active === "reminders"
              ? "bg-white/85 text-[#ed802a]"
              : "text-[#7a7a7a]"
          }`}
          href={reminderHref}
        >
          <Bell
            aria-hidden="true"
            className="mb-0.5 size-5"
            strokeWidth={1.7}
          />
          Reminders
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${itemClass} cursor-default text-[#c4c4c4]`}
        >
          <Bell
            aria-hidden="true"
            className="mb-0.5 size-5"
            strokeWidth={1.7}
          />
          Reminders
        </span>
      )}
      <Link
        aria-current={active === "profile" ? "page" : undefined}
        className={`${itemClass} ${
          active === "profile" ? "bg-white/85 text-[#ed802a]" : "text-[#7a7a7a]"
        }`}
        href="/profile"
      >
        <ContactRound
          aria-hidden="true"
          className="mb-0.5 size-5"
          strokeWidth={1.7}
        />
        Profile
      </Link>
    </nav>
  );
}
