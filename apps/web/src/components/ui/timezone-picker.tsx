"use client";

import { useId, useState } from "react";

const timezones = ["UTC", ...(Intl.supportedValuesOf?.("timeZone") ?? [])];

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function TimezonePicker({
  label = "Time zone",
  onChange,
  value,
}: {
  label?: string;
  onChange: (timezone: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchId = useId();
  const search = query.trim().toLowerCase().replaceAll(/[/_]/g, " ");
  const matches = search
    ? timezones
        .filter((timezone) =>
          timezone.toLowerCase().replaceAll(/[/_]/g, " ").includes(search),
        )
        .slice(0, 24)
    : [];
  const exactTimezone = query.trim();

  return (
    <div>
      <span className="block text-sm font-medium">{label}</span>
      <button
        aria-expanded={open}
        className="mt-2 min-h-11 w-full rounded-xl border border-[#ead9c7] bg-white/70 px-4 text-left text-sm text-[#2d2d2d] focus-visible:outline-2 focus-visible:outline-[#ed802a]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {value ? value.replaceAll("_", " ") : "Choose a time zone"}
        <span className="float-right font-semibold text-[#a96225]">
          {open ? "Close" : "Change"}
        </span>
      </button>
      {open ? (
        <div className="mt-2 rounded-xl border border-[#ead9c7] bg-white p-3">
          <label
            className="block text-xs font-semibold text-[#7a7a7a]"
            htmlFor={searchId}
          >
            Search worldwide time zones by city or region
          </label>
          <input
            autoComplete="off"
            className="mt-2 min-h-11 w-full rounded-lg border border-[#ead9c7] px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            id={searchId}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Perth or Europe/London"
            type="search"
            value={query}
          />
          {search ? (
            <div
              className="mt-2 max-h-56 overflow-y-auto"
              role="group"
              aria-label="Matching time zones"
            >
              {matches.length ? (
                matches.map((timezone) => (
                  <button
                    aria-pressed={timezone === value}
                    className="block min-h-11 w-full rounded-lg px-3 text-left text-sm hover:bg-[#fff3e4] focus-visible:outline-2 focus-visible:outline-[#ed802a]"
                    key={timezone}
                    onClick={() => {
                      onChange(timezone);
                      setOpen(false);
                      setQuery("");
                    }}
                    type="button"
                  >
                    {timezone.replaceAll("_", " ")}
                  </button>
                ))
              ) : isValidTimezone(exactTimezone) ? (
                <button
                  className="block min-h-11 w-full rounded-lg px-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-[#ed802a]"
                  onClick={() => {
                    onChange(exactTimezone);
                    setOpen(false);
                    setQuery("");
                  }}
                  type="button"
                >
                  Use {exactTimezone}
                </button>
              ) : (
                <p className="px-3 py-2 text-sm text-[#7a7a7a]">
                  No matching time zones.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#7a7a7a]">
              Type a city or region to find its time zone.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
