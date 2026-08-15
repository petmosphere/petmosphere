import { Bell, CalendarDays, House, Settings } from "lucide-react";
import Link from "next/link";

const unavailableItems = [
  { icon: CalendarDays, label: "Diary" },
  { icon: Bell, label: "Reminders" },
  { icon: Settings, label: "Settings" },
];

export function AppNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="sticky bottom-3 mx-4 mt-auto grid grid-cols-4 rounded-full bg-[#f3e8d8] p-2 shadow-lg shadow-stone-900/10"
    >
      <Link
        aria-current="page"
        className="flex min-h-12 flex-col items-center justify-center rounded-full bg-white text-xs font-medium text-[#ed802a]"
        href="/home"
      >
        <House aria-hidden="true" className="mb-0.5 size-5" strokeWidth={1.8} />
        Home
      </Link>
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
