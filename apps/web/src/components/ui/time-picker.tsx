"use client";

import { CircleX, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0–59
const PERIODS = ["AM", "PM"] as const;

// Scroll-snap slot height (px). Selected pill is 38px per Figma; 46 adds breathing room.
const ITEM_HEIGHT = 46;

function formatTimeLabel(time: string): string {
  const [h24 = 0, m = 0] = time.split(":").map(Number);
  const period = h24 < 12 ? "am" : "pm";
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface TimePickerProps {
  /** "HH:MM" 24-hour format, or undefined when unset */
  value: string | undefined;
  /** Fires with "HH:MM" only on Confirm */
  onChange: (time: string) => void;
  /** Accessible label; defaults to "Time" */
  label?: string;
  placeholder?: string;
  /** data-testid for a hidden native input — lets tests set time without the scroll UI */
  testId?: string;
}

/**
 * Self-contained time picker: trigger pill + slide-up bottom sheet.
 * Matches figma/petmosphere-diary-time-picker.css exactly.
 *
 * Trigger mirrors the DatePicker pill (same border, bg, height).
 * Sheet: drag handle, "Select Time" + CircleX, three scroll-snap columns
 * (hours 1–12 / minutes 00–59 / AM-PM), Confirm button bg-[#65bcb5].
 */
export function TimePicker({
  label = "Time",
  onChange,
  placeholder = "Select a time",
  testId,
  value,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Draft is local to the sheet; committed only on Confirm.
  const [draft, setDraft] = useState<string>(value ?? "12:00");

  function open() {
    setDraft(value ?? "12:00");
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function confirm() {
    onChange(draft);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const [h24Raw, mRaw] = draft.split(":").map(Number);
  const h24 = h24Raw ?? 0;
  const m = mRaw ?? 0;
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const period: (typeof PERIODS)[number] = h24 < 12 ? "AM" : "PM";

  function commit(nextHour: number, nextMin: number, nextPeriod: string) {
    let hour = nextHour % 12;
    if (nextPeriod === "PM") hour += 12;
    setDraft(
      `${String(hour).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`,
    );
  }

  return (
    <>
      {/* Trigger pill — same style as DatePicker */}
      <button
        aria-label={`${label}: ${value ? formatTimeLabel(value) : placeholder}`}
        className="flex h-11 w-full items-center justify-between rounded-[20px] border-[1.5px] border-[#ed802a] bg-white/60 px-4 transition-opacity active:opacity-70"
        onClick={open}
        type="button"
      >
        <span className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-[18px] text-[#ed802a]" />
          <span className="text-[15px] font-semibold text-[#2d2d2d]">
            {value ? formatTimeLabel(value) : placeholder}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-[14px] font-bold text-[#ed802a]"
        >
          ▾
        </span>
      </button>

      {/* Hidden native input — test escape hatch for jsdom (scroll-wheel is untestable) */}
      {testId && (
        <input
          aria-hidden="true"
          className="sr-only"
          data-testid={testId}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          type="time"
          value={value ?? ""}
        />
      )}

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      {/* Bottom sheet
          Figma: bg #ffffff, shadow 0px -4px 16px rgba(205,146,85,0.10),
          border-radius 24 24 0 0, padding 12px 24px 24px, gap 20px */}
      <div
        aria-hidden={!isOpen}
        aria-label={`Choose a ${label.toLowerCase()}`}
        aria-modal="true"
        className={`fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-h-[82dvh] max-w-md flex-col gap-5 overflow-hidden rounded-t-[24px] bg-white px-6 pt-3 pb-6 shadow-[0px_-4px_16px_rgba(205,146,85,0.10)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
      >
        {/* sheet-header: drag handle + title row — Figma height 41px, gap 12px */}
        <div className="flex flex-col gap-3">
          {/* drag-handle: 40×4px, bg #e0d7cd */}
          <div className="mx-auto h-1 w-10 rounded-full bg-[#e0d7cd]" />
          {/* title-row */}
          <div className="flex items-center justify-between">
            {/* "Select Time": Manrope 700 18px #2d2d2d */}
            <span className="text-[18px] leading-[25px] font-bold text-[#2d2d2d]">
              Select Time
            </span>
            {/* x-circle: 20×20px, stroke #7a7a7a */}
            <button
              aria-label="Close time picker"
              className="flex size-5 items-center justify-center text-[#7a7a7a] transition-opacity active:opacity-60"
              onClick={close}
              type="button"
            >
              <CircleX aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        {/* time-picker-scroller: padding 16px 0, height 192px (= 16+160+16) */}
        <div className="relative flex items-center gap-4 py-4">
          {/* Full-width selection band (Figma selection-band-top/bottom at #f0e6d8,
              individual column pills: bg #fdf8f2, border #f0e6d8, border-radius 8px) */}
          <span className="pointer-events-none absolute top-1/2 right-0 left-0 h-[38px] -translate-y-1/2 rounded-[8px] border border-[#f0e6d8] bg-[#fdf8f2]" />
          {/* hour column */}
          <Wheel
            items={HOURS}
            onSelect={(h) => commit(h, m, period)}
            renderItem={(h) => String(h)}
            value={hour12}
          />
          {/* colon: Manrope 700 22px #2d2d2d */}
          <span
            aria-hidden="true"
            className="z-10 text-[22px] leading-[30px] font-bold text-[#2d2d2d]"
          >
            :
          </span>
          {/* minute column */}
          <Wheel
            items={MINUTES}
            onSelect={(mn) => commit(hour12, mn, period)}
            renderItem={(mn) => String(mn).padStart(2, "0")}
            value={m}
          />
          {/* AM/PM column */}
          <Wheel
            items={PERIODS}
            onSelect={(p) => commit(hour12, m, p)}
            renderItem={(p) => p}
            value={period}
          />
        </div>

        {/* confirm-button: bg #65bcb5, h 50px, border-radius 24px, Manrope 700 16px white */}
        <button
          className="flex h-[50px] w-full items-center justify-center rounded-[24px] bg-[#65bcb5] text-base font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98]"
          onClick={confirm}
          type="button"
        >
          Confirm
        </button>
      </div>
    </>
  );
}

/**
 * Snap-scrolling wheel column. CSS scroll-snap-mandatory keeps the settled
 * position exact; we read scrollTop on scroll to update draft state.
 */
function Wheel<T extends number | string>({
  items,
  onSelect,
  renderItem,
  value,
}: {
  items: readonly T[];
  onSelect: (value: T) => void;
  renderItem: (value: T) => string;
  value: T;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const index = Math.max(0, items.indexOf(value));

  // Sync scroll position when value changes externally (e.g. sheet open).
  useEffect(() => {
    ref.current?.scrollTo?.({ top: index * ITEM_HEIGHT, behavior: "auto" });
  }, [index]);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / ITEM_HEIGHT);
    const next = items[Math.max(0, Math.min(items.length - 1, i))];
    if (next !== undefined && next !== value) onSelect(next);
  }

  // Column height 160px per Figma scroller-columns.
  // Padding lets the first/last item scroll to centre.
  const PAD = (160 - ITEM_HEIGHT) / 2;

  return (
    <div
      className="relative h-[160px] flex-1 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
      }}
    >
      <div
        className="h-full snap-y snap-mandatory overflow-y-auto"
        onScroll={handleScroll}
        ref={ref}
        role="listbox"
        style={{ scrollbarWidth: "none" }}
      >
        <div style={{ height: PAD }} />
        {items.map((item) => {
          const selected = item === value;
          return (
            <div
              aria-selected={selected}
              className="grid snap-center place-items-center"
              key={String(item)}
              role="option"
              style={{ height: ITEM_HEIGHT }}
            >
              {/* selected: Manrope 700 22px #2d2d2d; unselected: 400 18px #7a7a7a */}
              <span
                className={
                  selected
                    ? "z-10 text-[22px] font-bold text-[#2d2d2d]"
                    : "text-[18px] font-normal text-[#7a7a7a]"
                }
              >
                {renderItem(item)}
              </span>
            </div>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}
