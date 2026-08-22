import { Bell, CalendarDays, ContactRound, House } from "lucide-react";
import Link from "next/link";

export function AppNav({
  active = "home",
  diaryHref,
  profileHref,
  reminderHref,
}: {
  active?: "diary" | "home" | "reminders";
  diaryHref?: string | undefined;
  profileHref?: string | undefined;
  reminderHref?: string | undefined;
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-4 mt-auto grid grid-cols-4 rounded-full bg-[#f0e6d8] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
    >
      <Link
        aria-current={active === "home" ? "page" : undefined}
        className={`flex min-h-12 flex-col items-center justify-center rounded-full text-[10px] leading-3 font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] ${active === "home" ? "bg-white text-[#ed802a]" : "text-[#7a7a7a]"}`}
        href="/home"
      >
        <House aria-hidden="true" className="mb-1 size-5" strokeWidth={1.8} />
        Home
      </Link>
      {diaryHref ? (
        <Link
          aria-current={active === "diary" ? "page" : undefined}
          className={`flex min-h-12 flex-col items-center justify-center rounded-full text-[10px] leading-3 font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] ${active === "diary" ? "bg-white text-[#ed802a]" : "text-[#7a7a7a]"}`}
          href={diaryHref}
        >
          <CalendarDays
            aria-hidden="true"
            className="mb-1 size-5"
            strokeWidth={1.8}
          />
          Diary
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="flex min-h-12 flex-col items-center justify-center text-[10px] leading-3 text-[#7a7a7a]"
        >
          <CalendarDays
            aria-hidden="true"
            className="mb-1 size-5"
            strokeWidth={1.7}
          />
          Diary
        </span>
      )}
      {reminderHref ? (
        <Link
          aria-current={active === "reminders" ? "page" : undefined}
          className={`flex min-h-12 flex-col items-center justify-center rounded-full text-[10px] leading-3 font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] ${active === "reminders" ? "bg-white text-[#ed802a]" : "text-[#7a7a7a]"}`}
          href={reminderHref}
        >
          <Bell aria-hidden="true" className="mb-1 size-5" strokeWidth={1.7} />
          Reminders
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="flex min-h-12 flex-col items-center justify-center text-[10px] leading-3 text-[#7a7a7a]"
        >
          <Bell aria-hidden="true" className="mb-1 size-5" strokeWidth={1.7} />
          Reminders
        </span>
      )}
      {profileHref ? (
        <Link
          className="flex min-h-12 flex-col items-center justify-center rounded-full text-[10px] leading-3 font-medium text-[#7a7a7a] transition-transform duration-150 ease-out active:scale-[0.97]"
          href={profileHref}
        >
          <ContactRound
            aria-hidden="true"
            className="mb-1 size-5"
            strokeWidth={1.7}
          />
          Profile
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="flex min-h-12 flex-col items-center justify-center text-[10px] leading-3 text-[#7a7a7a]"
        >
          <ContactRound
            aria-hidden="true"
            className="mb-1 size-5"
            strokeWidth={1.7}
          />
          Profile
        </span>
      )}
    </nav>
  );
}
