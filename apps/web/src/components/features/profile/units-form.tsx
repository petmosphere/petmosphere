"use client";

import { useState } from "react";

import { AppNav } from "@/components/features/pets/app-nav";

import { ProfileShell } from "./profile-shell";

type Units = { weightUnit: "kg" | "lb" };

function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <div className="rounded-3xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(205,146,85,0.10)]">
      <p className="px-1 text-sm font-bold tracking-wide text-[#7a7a7a] uppercase">
        {label}
      </p>
      <div className="mt-3 grid grid-cols-2 rounded-full bg-[#ede3d7] p-1.5">
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className={`min-h-12 rounded-full font-semibold transition-[background-color,color] duration-150 ${
              option.value === value
                ? "bg-[#ed802a] text-white shadow-[0_2px_8px_rgba(237,128,42,0.25)]"
                : "text-[#7a7a7a]"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UnitsForm({
  diaryHref,
  initialUnits,
}: {
  diaryHref?: string | undefined;
  initialUnits: Units;
}) {
  const [units, setUnits] = useState(initialUnits);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function update(next: Units) {
    const previous = units;
    setUnits(next);
    setStatus("saving");
    try {
      const response = await fetch("/api/v1/profile/units", {
        body: JSON.stringify(next),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) throw new Error();
      setStatus("saved");
    } catch {
      setUnits(previous);
      setStatus("error");
    }
  }

  return (
    <ProfileShell title="Units">
      <div className="mt-8 space-y-5">
        <SegmentedControl
          label="Weight"
          onChange={(weightUnit) => void update({ ...units, weightUnit })}
          options={[
            { label: "kg", value: "kg" },
            { label: "lb", value: "lb" },
          ]}
          value={units.weightUnit}
        />
        <p
          aria-live="polite"
          className={`text-center text-sm ${status === "error" ? "text-red-700" : "text-[#7a7a7a]"}`}
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Units saved"
              : status === "error"
                ? "Units could not be saved. Try again."
                : "Changes save automatically."}
        </p>
      </div>
      <div className="h-20" aria-hidden="true" />
      <AppNav
        active="profile"
        diaryHref={diaryHref}
        fixed
        reminderHref="/reminders"
      />
    </ProfileShell>
  );
}
