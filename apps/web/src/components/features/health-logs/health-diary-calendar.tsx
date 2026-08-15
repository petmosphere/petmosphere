import type { HealthLogSummary } from "@petmosphere/api-contracts";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { healthLogStatusDetails } from "./health-log-status-options";

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

function monthDate(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, monthNumber! - 1, 1));
}

export function moveMonth(month: string, amount: number) {
  const date = monthDate(month);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export function HealthDiaryCalendar({
  logs,
  month,
  onAddToday,
  onMonthChange,
  onSelectDate,
  today,
}: {
  logs: HealthLogSummary[];
  month: string;
  onAddToday: () => void;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
  today: string;
}) {
  const first = monthDate(month);
  const days = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const byDate = new Map(logs.map((log) => [log.localDate, log]));
  const cells = Array.from({ length: leading + days }, (_, index) => {
    if (index < leading) return null;
    const day = index - leading + 1;
    return `${month}-${String(day).padStart(2, "0")}`;
  });

  return (
    <section aria-label="Health diary calendar">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#a96225]">Private history</p>
          <h1 className="mt-1 text-4xl font-bold">Health Diary</h1>
        </div>
        <button
          aria-label="Add a health log for today"
          className="grid size-14 place-items-center rounded-full bg-[#f47b20] text-white shadow-lg shadow-[#f47b20]/20 transition-transform duration-150 ease-out active:scale-[0.97]"
          onClick={onAddToday}
          type="button"
        >
          <Plus aria-hidden="true" className="size-7" />
        </button>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button aria-label="Previous month" className="grid size-11 place-items-center rounded-full text-stone-500 active:scale-[0.97]" onClick={() => onMonthChange(moveMonth(month, -1))} type="button"><ChevronLeft aria-hidden="true" /></button>
          <h2 className="text-lg font-semibold">
            {new Intl.DateTimeFormat("en-AU", { month: "long", timeZone: "UTC", year: "numeric" }).format(first)}
          </h2>
          <button aria-label="Next month" className="grid size-11 place-items-center rounded-full text-stone-500 disabled:opacity-30 active:scale-[0.97]" disabled={month >= today.slice(0, 7)} onClick={() => onMonthChange(moveMonth(month, 1))} type="button"><ChevronRight aria-hidden="true" /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-stone-400">
          {weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-y-1">
          {cells.map((date, index) => {
            if (!date) return <span aria-hidden="true" key={`empty-${index}`} />;
            const log = byDate.get(date);
            const details = log ? healthLogStatusDetails[log.status] : null;
            const Icon = details?.icon;
            const future = date > today;
            return (
              <button
                aria-label={`${new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(`${date}T12:00:00`))}${details ? `, ${details.label}` : ", no log"}`}
                className={`mx-auto flex size-12 flex-col items-center justify-center rounded-2xl text-sm transition-[background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-[#ed802a] enabled:active:scale-[0.96] ${date === today ? "bg-[#fff3e4] font-bold text-[#a96225]" : "text-stone-600"}`}
                disabled={future}
                key={date}
                onClick={() => onSelectDate(date)}
                type="button"
              >
                <span>{Number(date.slice(-2))}</span>
                {Icon ? <Icon aria-hidden="true" className={`mt-0.5 size-4 ${details?.selectedClass.split(" ").at(-1)}`} strokeWidth={2} /> : <span className="mt-1 size-1 rounded-full bg-stone-200" />}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-stone-500">
        Select a date to view or add an entry.
      </p>
    </section>
  );
}
