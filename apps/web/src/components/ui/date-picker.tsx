"use client";

import { CalendarDays, ChevronLeft, ChevronRight, CircleX } from "lucide-react";
import { useState } from "react";

// Single-char day labels per Figma diary-date-picker
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

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

// Day labels for aria (full names so screen readers can announce them)
const DAY_ARIA_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function toISO(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateToISO(d: Date): string {
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDisplay(iso: string, todayISO: string): string {
  const [year, month, day] = iso.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const short = MONTH_SHORT[month - 1];
  if (iso === todayISO) return `Today, ${day} ${short}`;
  return `${day} ${short} ${year}`;
}

export interface DatePickerProps {
  value: string | undefined;
  onChange: (date: string) => void;
  label?: string;
  /** Upper bound — omit to allow any future date. */
  maxDate?: Date;
  /** Lower bound — omit to allow any past date. */
  minDate?: Date;
  placeholder?: string;
}

// Cell represents a day slot in the calendar grid.
// monthOffset: -1 = previous month, 0 = current, 1 = next month
type Cell = { day: number; monthOffset: -1 | 0 | 1 };

export function DatePicker({
  label,
  maxDate,
  minDate,
  onChange,
  placeholder = "Select a date",
  value,
}: DatePickerProps) {
  const todayISO = dateToISO(new Date());
  const maxISO = maxDate ? dateToISO(maxDate) : undefined;
  const minISO = minDate ? dateToISO(minDate) : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<string | undefined>(value);

  function open() {
    const anchor = value ?? minISO ?? todayISO;
    const [sy, sm] = anchor.split("-").map(Number) as [number, number];
    setPending(value);
    setViewYear(sy);
    setViewMonth(sm - 1);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function confirm() {
    if (pending) onChange(pending);
    setIsOpen(false);
  }

  // Calendar view state
  const seedISO = value ?? minISO ?? todayISO;
  const [seedYear, seedMonth0] = seedISO.split("-").map(Number) as [
    number,
    number,
  ];
  const [viewYear, setViewYear] = useState(seedYear);
  const [viewMonth, setViewMonth] = useState(seedMonth0 - 1); // 0-indexed

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (maxISO) {
      const [maxY, maxM] = maxISO.split("-").map(Number) as [number, number];
      if (viewYear === maxY && viewMonth === maxM - 1) return;
    }
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const isNextDisabled = maxISO
    ? (() => {
        const [maxY, maxM] = maxISO.split("-").map(Number) as [number, number];
        return viewYear === maxY && viewMonth === maxM - 1;
      })()
    : false;

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();

  // Build grid cells: leading prev-month days, current month, trailing next-month days
  const cells: Cell[] = [
    ...Array.from({ length: firstDayOfMonth }, (_, i) => ({
      day: prevMonthLastDay - firstDayOfMonth + i + 1,
      monthOffset: -1 as const,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      monthOffset: 0 as const,
    })),
  ];
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, monthOffset: 1 as const });
  }

  const displayLabel = label ?? "Date";

  return (
    <>
      {/* Date pill trigger */}
      <button
        aria-label={`${displayLabel}: ${value ? formatDisplay(value, todayISO) : placeholder}. Tap to change.`}
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
            {value ? formatDisplay(value, todayISO) : placeholder}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-[14px] font-bold text-[#ed802a]"
        >
          ▾
        </span>
      </button>

      {/* Backdrop — closes without applying pending */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      {/* Bottom sheet
          Figma: padding 12px 24px 24px, gap 20px, bg #ffffff,
          border-radius 24 24 0 0, shadow 0 -4 16 rgba(205,146,85,0.10)
          max-h-[90dvh] so it never overflows the viewport */}
      <div
        aria-hidden={!isOpen}
        aria-label={`Choose a ${displayLabel.toLowerCase()}`}
        aria-modal="true"
        className={`fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-h-[82dvh] max-w-md flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0px_-4px_16px_rgba(205,146,85,0.10)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
      >
        {/* Fixed header section — never scrolls */}
        <div className="flex flex-col gap-3 px-6 pt-3">
          {/* Drag handle */}
          <div className="mx-auto h-1 w-10 rounded-full bg-[#e0d7cd]" />
          {/* Title + close */}
          <div className="flex items-center justify-between">
            <span className="text-[18px] leading-[25px] font-bold text-[#2d2d2d]">
              Select Date
            </span>
            <button
              aria-label="Close date picker"
              className="flex size-5 items-center justify-center text-[#7a7a7a] transition-opacity active:opacity-60"
              onClick={close}
              type="button"
            >
              <CircleX aria-hidden="true" className="size-5" />
            </button>
          </div>
          {/* Month / year nav */}
          <div className="flex items-center justify-between">
            <button
              aria-label="Previous month"
              className="flex size-8 items-center justify-center rounded-lg bg-[#fdf8f2] text-[#2d2d2d] transition-opacity active:opacity-60"
              onClick={prevMonth}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4 stroke-2" />
            </button>
            <span className="text-base font-bold text-[#2d2d2d]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              aria-label="Next month"
              className="flex size-8 items-center justify-center rounded-lg bg-[#fdf8f2] text-[#2d2d2d] transition-opacity active:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={isNextDisabled}
              onClick={nextMonth}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4 stroke-2" />
            </button>
          </div>
          {/* Day-of-week header */}
          <div className="grid grid-cols-7">
            {DAY_LABELS.map((d, i) => (
              <div
                aria-label={DAY_ARIA_NAMES[i]}
                className="flex h-4 items-center justify-center text-[12px] font-bold text-[#7a7a7a]"
                key={`${d}-${i}`}
                role="columnheader"
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable calendar grid — shrinks/grows to fill available space */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="grid grid-cols-7 gap-y-1.5">
            {cells.map(({ day, monthOffset }) => {
              let cy = viewYear;
              let cm = viewMonth + monthOffset;
              if (cm < 0) {
                cy--;
                cm = 11;
              } else if (cm > 11) {
                cy++;
                cm = 0;
              }
              const cellKey = toISO(cy, cm, day);

              if (monthOffset !== 0) {
                return (
                  <div
                    aria-hidden="true"
                    className="mx-auto flex size-9 items-center justify-center text-[14px] font-normal text-[#aaaaaa]"
                    key={cellKey}
                  >
                    {day}
                  </div>
                );
              }

              const iso = cellKey;
              const isSelected = iso === pending;
              const isAfterMax = maxISO ? iso > maxISO : false;
              const isBeforeMin = minISO ? iso < minISO : false;
              const isDisabled = isAfterMax || isBeforeMin;
              const isToday = iso === todayISO;

              return (
                <button
                  aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}${isSelected ? ", selected" : ""}`}
                  aria-pressed={isSelected}
                  className={[
                    "mx-auto flex size-9 items-center justify-center rounded-[18px] text-[14px] transition-colors",
                    isSelected
                      ? "bg-[#ed802a] font-bold text-white"
                      : isDisabled
                        ? "cursor-not-allowed font-normal text-[#aaaaaa] opacity-40"
                        : isToday
                          ? "bg-[#ed802a]/10 font-medium text-[#2d2d2d]"
                          : "font-medium text-[#2d2d2d] hover:bg-[#f0e6d8]",
                  ].join(" ")}
                  disabled={isDisabled}
                  key={iso}
                  onClick={() => setPending(iso)}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm button — always pinned at bottom */}
        <div className="px-6 pt-3 pb-6">
          <button
            className="flex h-[50px] w-full items-center justify-center rounded-[24px] bg-[#65bcb5] text-base font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98]"
            onClick={confirm}
            type="button"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}
