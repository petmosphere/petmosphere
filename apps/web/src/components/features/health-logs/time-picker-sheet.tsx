"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"] as const;

const ITEM_HEIGHT = 46; // row height incl. gap; matches selected pill + neighbors

/**
 * Bottom-sheet time picker matching figma/petmosphere-diary-time-picker.css:
 * a sliding bottom sheet with a drag handle, "Select Time" header + close,
 * three wheel columns (hour / minute / AM-PM) with the selected value in a
 * highlighted pill, and a Confirm button. Value is HH:mm (24h, as stored by
 * the reminder); the wheels present 12h with an AM/PM column.
 */
export function TimePickerSheet({
  onClose,
  onConfirm,
  open,
  value,
}: {
  onClose: () => void;
  onConfirm: (value: string) => void;
  open: boolean;
  value: string;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const [h24 = 0, m = 0] = draft.split(":").map(Number);
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const period: (typeof PERIODS)[number] = h24 < 12 ? "AM" : "PM";

  function commit(nextHour: number, nextMin: number, nextPeriod: string) {
    let hour = nextHour % 12;
    if (nextPeriod === "PM") hour += 12;
    const hh = String(hour).padStart(2, "0");
    const mm = String(nextMin).padStart(2, "0");
    setDraft(`${hh}:${mm}`);
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/[0.15]"
      onClick={onClose}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex w-full max-w-md flex-col rounded-t-3xl bg-white shadow-[0px_-4px_20px_rgba(0,0,0,0.15)] motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-[#e5e5e5]" />
        </div>

        <div className="flex items-center justify-between px-6 py-2">
          <h2 className="text-lg font-bold text-[#2d2d2d]" id={titleId}>
            Select Time
          </h2>
          <button
            aria-label="Close"
            className="grid size-7 place-items-center rounded-full bg-[#f0e6d8]/40 text-[#2d2d2d] focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-3" strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative flex items-center justify-center gap-6 px-6 py-2">
          {/* selected highlight band */}
          <span className="pointer-events-none absolute top-1/2 right-6 left-6 h-[38px] -translate-y-1/2 rounded-lg border border-[#f0e6d8] bg-[#fdf8f2]" />
          <Wheel
            items={HOURS}
            onSelect={(h) => commit(h, m, period)}
            renderItem={(h) => String(h)}
            value={hour12}
          />
          <span className="z-10 text-[22px] font-bold text-[#2d2d2d]">:</span>
          <Wheel
            items={MINUTES}
            onSelect={(mn) => commit(hour12, mn, period)}
            renderItem={(mn) => String(mn).padStart(2, "0")}
            value={m}
          />
          <Wheel
            items={PERIODS}
            onSelect={(p) => commit(hour12, m, p)}
            renderItem={(p) => p}
            value={period}
          />
        </div>

        <div className="px-6 pt-3 pb-6">
          <button
            className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-[#ed802a] text-base font-bold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c] active:scale-[0.98] motion-reduce:transition-none"
            onClick={() => {
              onConfirm(draft);
              onClose();
            }}
            type="button"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Snap-scrolling wheel. Each column is a scroll container; the item nearest
 * the centre is "selected". We don't fight the native scroll — we read the
 * snapped offset on scroll-end and commit it. Disabled scroll snapping is
 * intentionally avoided to keep the wheel feel natural.
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

  // Centre the selected item on mount and whenever the value changes externally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: "auto" });
  }, [index]);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    const next = items[clamped];
    if (next !== undefined && next !== value) onSelect(next);
  }

  return (
    <div
      className="relative h-[160px] flex-1 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
      }}
    >
      <div
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
        onScroll={handleScroll}
        ref={ref}
        role="listbox"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* top/bottom padding so the first/last item can centre */}
        <div style={{ height: (160 - ITEM_HEIGHT) / 2 }} />
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
              <span
                className={
                  selected
                    ? "text-[22px] font-bold text-[#2d2d2d]"
                    : "text-[18px] font-normal text-[#7a7a7a]"
                }
              >
                {renderItem(item)}
              </span>
            </div>
          );
        })}
        <div style={{ height: (160 - ITEM_HEIGHT) / 2 }} />
      </div>
    </div>
  );
}
