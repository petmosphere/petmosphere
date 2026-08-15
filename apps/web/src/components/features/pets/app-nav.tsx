import { Bell, CalendarDays, House, Settings } from "lucide-react";
import Link from "next/link";

const unavailableItems = [
  { icon: Bell, label: "Reminders" },
  { icon: Settings, label: "Settings" },
];

export function AppNav({
  active = "home",
  diaryHref,
}: {
  active?: "diary" | "home";
  diaryHref?: string;
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className="sticky bottom-3 mx-4 mt-auto grid grid-cols-4 rounded-full bg-[#f3e8d8] p-2 shadow-lg shadow-stone-900/10"
    >
      <Link
        aria-current={active === "home" ? "page" : undefined}
        className={`flex min-h-12 flex-col items-center justify-center rounded-full text-xs font-medium ${active === "home" ? "bg-white text-[#ed802a]" : "text-stone-500"}`}
        href="/home"
      >
        <House aria-hidden="true" className="mb-0.5 size-5" strokeWidth={1.8} />
        Home
      </Link>
      {diaryHref ? (
        <Link
          aria-current={active === "diary" ? "page" : undefined}
          className={`flex min-h-12 flex-col items-center justify-center rounded-full text-xs font-medium ${active === "diary" ? "bg-white text-[#ed802a]" : "text-stone-500"}`}
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
          className="flex min-h-12 flex-col items-center justify-center text-xs text-stone-500"
        >
          <CalendarDays
            aria-hidden="true"
            className="mb-0.5 size-5"
            strokeWidth={1.7}
          />
          Diary
        </span>
      )}
      {unavailableItems.map(({ icon: Icon, label }) => (
        <span
          aria-disabled="true"
          className="flex min-h-12 flex-col items-center justify-center text-xs text-stone-500"
          key={label}
        >
          <Icon
            aria-hidden="true"
            className="mb-0.5 size-5"
            strokeWidth={1.7}
          />
          {label}
        </span>
      ))}
    </nav>
  );
}
