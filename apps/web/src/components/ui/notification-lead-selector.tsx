"use client";

import { Check, CircleX } from "lucide-react";
import { useState } from "react";

export interface NotificationLeadOption {
  value: number | null;
  label: string;
}

export interface NotificationLeadSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  options: ReadonlyArray<NotificationLeadOption>;
  label?: string;
}

export function NotificationLeadSelector({
  label = "Notify me",
  onChange,
  options,
  value,
}: NotificationLeadSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<number | null>(value);

  function open() {
    setPending(value);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function confirm() {
    onChange(pending);
    setIsOpen(false);
  }

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? String(value);

  return (
    <>
      <button
        aria-label={`${label}: ${selectedLabel}. Tap to change.`}
        className="flex h-11 w-full items-center justify-between rounded-[20px] border-[1.5px] border-[#ed802a] bg-white/60 px-4 transition-opacity active:opacity-70"
        onClick={open}
        type="button"
      >
        <span className="text-[15px] font-semibold text-[#2d2d2d]">
          {selectedLabel}
        </span>
        <span
          aria-hidden="true"
          className="text-[14px] font-bold text-[#ed802a]"
        >
          ▾
        </span>
      </button>

      {/* Scrim */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      {/* Bottom sheet */}
      <div
        aria-hidden={!isOpen}
        aria-label="Choose notification timing"
        aria-modal="true"
        className={`fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-h-[82dvh] max-w-md flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0px_-4px_16px_rgba(205,146,85,0.10)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
      >
        {/* Sheet header */}
        <div className="flex flex-col gap-3 px-6 pt-3 pb-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-[#e0d7cd]" />
          <div className="flex items-center justify-between">
            <span className="text-[18px] leading-[25px] font-bold text-[#2d2d2d]">
              Notify me
            </span>
            <button
              aria-label="Close notify me selector"
              className="flex size-5 items-center justify-center text-[#7a7a7a] transition-opacity active:opacity-60"
              onClick={close}
              type="button"
            >
              <CircleX aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="flex flex-col gap-2">
            {options.map((option) => {
              const selected = option.value === pending;
              const key = option.value === null ? "none" : option.value;
              return (
                <button
                  aria-pressed={selected}
                  className={`flex h-12 w-full items-center justify-between rounded-xl px-3.5 shadow-[0px_2px_8px_rgba(237,128,42,0.10)] transition-colors ${
                    selected
                      ? "border-[1.5px] border-[#ed802a] bg-white/60"
                      : "border border-[#f0e6d8] bg-white/60"
                  }`}
                  key={key}
                  onClick={() => setPending(option.value)}
                  type="button"
                >
                  <span
                    className={`text-[14px] leading-[19px] text-[#2d2d2d] ${
                      selected ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {option.label}
                  </span>
                  {selected ? (
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full bg-[#ed802a]"
                    >
                      <Check className="size-2.5 stroke-[3] text-white" />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-[18px] rounded-full border border-[#f0e6d8]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm button */}
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
