import { CalendarDays, House } from "lucide-react";
import Link from "next/link";

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mb-0.5 size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="30 5 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M30.5 15C30.5 10.5217 30.5 8.28249 31.8912 6.89124C33.2825 5.5 35.5217 5.5 40 5.5C44.4783 5.5 46.7175 5.5 48.1088 6.89124C49.5 8.28249 49.5 10.5217 49.5 15C49.5 19.4783 49.5 21.7175 48.1088 23.1088C46.7175 24.5 44.4783 24.5 40 24.5C35.5217 24.5 33.2825 24.5 31.8912 23.1088C30.5 21.7175 30.5 19.4783 30.5 15Z" />
      <path d="M43 13C43 11.3431 41.6569 10 40 10C38.3431 10 37 11.3431 37 13C37 14.6569 38.3431 16 40 16C41.6569 16 43 14.6569 43 13Z" />
      <path d="M45 21C45 18.2386 42.7614 16 40 16C37.2386 16 35 18.2386 35 21" />
    </svg>
  );
}

function RemindersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mb-0.5 size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="31 6 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="37.845" x2="49" y1="8.125" y2="8.125" />
      <line x1="37.845" x2="49" y1="15" y2="15" />
      <line x1="37.845" x2="49" y1="21.875" y2="21.875" />
      <circle cx="33.155" cy="8.125" r="2.125" />
      <circle cx="33.155" cy="15" r="2.125" />
      <circle cx="33.155" cy="21.875" r="2.125" />
    </svg>
  );
}

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
          <RemindersIcon />
          Reminders
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${itemClass} cursor-default text-[#c4c4c4]`}
        >
          <RemindersIcon />
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
        <ProfileIcon />
        Profile
      </Link>
    </nav>
  );
}
