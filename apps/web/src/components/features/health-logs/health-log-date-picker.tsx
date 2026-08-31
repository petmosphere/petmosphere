"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplay(iso: string, today: string): string {
  const [year, month, day] = iso.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const short = MONTH_SHORT[month - 1];
  if (iso === today) return `Today, ${day} ${short}`;
  return `${day} ${short} ${year}`;
}

export function HealthLogDatePicker({
  onChange,
  today,
  value,
}: {
  onChange: (date: string) => void;
  today: string;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(value);

  // Calendar view state (reset when sheet opens)
  const seed = pending || today;
  const [initYear, initMonth0] = seed.split("-").map(Number) as [
    number,
    number,
  ];
  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth0 - 1); // 0-indexed

  function open() {
    // Sync pending + view to current confirmed value
    const s = value || today;
    const [sy, sm] = s.split("-").map(Number) as [number, number];
    setPending(value);
    setViewYear(sy);
    setViewMonth(sm - 1);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function confirm() {
    onChange(pending);
    setIsOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const [ty, tm] = today.split("-").map(Number) as [number, number];
    if (viewYear === ty && viewMonth === tm - 1) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const isNextDisabled = viewYear === ty && viewMonth === tm - 1;

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      {/* Date pill trigger */}
      <button
        aria-label={`Date: ${value ? formatDisplay(value, today) : "Select a date"}. Tap to change.`}
        className="flex h-11 w-full items-center justify-between rounded-[20px] border-[1.5px] border-[#ed802a] bg-white/60 px-4 transition-opacity active:opacity-70"
        onClick={open}
        type="button"
      >
        <span className="flex items-center gap-2">
          <CalendarDays
            aria-hidden="true"
            className="size-[18px] text-[#ed802a]"
          />
          <span className="text-[15px] font-semibold text-[#2d2d2d]">
            {value ? formatDisplay(value, today) : "Select a date"}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-[14px] font-bold text-[#ed802a]"
        >
          ▾
        </span>
      </button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      {/* Bottom sheet */}
      <div
        aria-label="Choose a date"
        aria-modal="true"
        className={`fixed right-0 bottom-0 left-0 z-50 mx-auto max-w-md rounded-t-3xl bg-[#fdf8f2] px-5 pt-3 pb-8 shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d5c9bc]" />

        {/* Month / year navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-lg bg-[#f0e6d8] text-[#2d2d2d] transition-opacity active:opacity-60"
            onClick={prevMonth}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          <span className="text-[15px] font-bold text-[#2d2d2d]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <button
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-lg bg-[#f0e6d8] text-[#2d2d2d] transition-opacity active:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
            disabled={isNextDisabled}
            onClick={nextMonth}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="mb-1 grid grid-cols-7">
          {DAY_NAMES.map((d) => (
            <div
              className="py-1 text-center text-[12px] font-semibold text-[#7a7a7a]"
              key={d}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid — tapping a day updates pending only */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;

            const iso = toISO(viewYear, viewMonth, day);
            const isSelected = iso === pending;
            const isFuture = iso > today;
            const isToday = iso === today;

            return (
              <button
                aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}${isSelected ? ", selected" : ""}`}
                aria-pressed={isSelected}
                className={[
                  "mx-auto flex size-9 items-center justify-center rounded-xl text-[14px] font-semibold transition-colors",
                  isSelected
                    ? "bg-[#ed802a] text-white"
                    : isFuture
                      ? "cursor-not-allowed text-[#aaa095] opacity-40"
                      : isToday
                        ? "bg-[#ed802a]/10 text-[#2d2d2d]"
                        : "text-[#2d2d2d] hover:bg-[#f0e6d8]",
                ].join(" ")}
                disabled={isFuture}
                key={iso}
                onClick={() => setPending(iso)}
                type="button"
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Confirm */}
        <button
          className="mt-5 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#65bcb5] text-base font-bold text-[#fdf8f2] transition-transform duration-150 ease-out active:scale-[0.98]"
          onClick={confirm}
          type="button"
        >
          Done
        </button>
      </div>
    </>
  );
}
