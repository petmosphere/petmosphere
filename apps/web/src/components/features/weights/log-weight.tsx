"use client";

import type {
  WeightEntryResponse,
  WeightReminderResponse,
} from "@petmosphere/api-contracts";
import type {
  Pet,
  WeightEntry,
  WeightReminderFrequency,
  WeightUnit,
} from "@petmosphere/domain";
import { weightFromKilograms, weightToKilograms } from "@petmosphere/domain";
import { ArrowLeft, Bell, LoaderCircle, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  enablePushNotifications,
  pushSetupErrorMessages,
} from "@/lib/health-logs/push-notifications";

import { WeightTrendChart } from "./weight-trend-chart";

const frequencies: { label: string; value: WeightReminderFrequency }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Fortnightly", value: "fortnightly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
];
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatLastEntry(entry: WeightEntry | undefined, unit: WeightUnit) {
  if (!entry) return "No records yet";
  const date = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${entry.localDate}T12:00:00Z`));
  return `Last recorded: ${Number(weightFromKilograms(entry.weightKg, unit).toFixed(2))} ${unit} (${date})`;
}

function formatWeightInput(weight: number) {
  return weight.toFixed(weight % 1 === 0 ? 1 : 2);
}

export function LogWeight({
  entries: initialEntries,
  pet,
  reminder: savedReminder,
  weightUnit = "kg",
}: {
  entries: WeightEntry[];
  pet: Pet;
  reminder: WeightReminderResponse | null;
  weightUnit?: WeightUnit;
}) {
  const latest = initialEntries.at(-1);
  const [entries, setEntries] = useState(initialEntries);
  const [weightInput, setWeightInput] = useState(
    formatWeightInput(weightFromKilograms(latest?.weightKg ?? 0, weightUnit)),
  );
  const [reminder, setReminder] = useState({
    enabled: savedReminder?.enabled ?? false,
    frequency: savedReminder?.frequency ?? ("weekly" as const),
    localTime: savedReminder?.localTime ?? "20:00",
    scheduleDay: savedReminder?.scheduleDay ?? 0,
  });
  const [weightDirty, setWeightDirty] = useState(false);
  const [reminderDirty, setReminderDirty] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const weekly =
    reminder.frequency === "weekly" || reminder.frequency === "fortnightly";
  const weight = Number(weightInput);
  const weightKg = weightToKilograms(weight, weightUnit);
  const maxWeight = weightFromKilograms(300, weightUnit);
  const validWeight =
    /^\d+(?:\.\d{1,2})?$/.test(weightInput) && weight > 0 && weightKg <= 300;

  function changeWeight(amount: number) {
    const current = Number(weightInput) || 0;
    setWeightInput(
      Math.max(0, Math.round((current + amount) * 10) / 10).toFixed(1),
    );
    setWeightDirty(true);
    setState("idle");
  }

  async function save() {
    if ((!weightDirty && !reminderDirty) || (weightDirty && !validWeight))
      return;
    setState("saving");
    setMessage("");
    try {
      let pushFailure: string | null = null;
      if (reminderDirty && reminder.enabled) {
        const push = await enablePushNotifications();
        if (!push.ok) pushFailure = pushSetupErrorMessages[push.reason];
      }
      const [weightResponse, reminderResponse] = await Promise.all([
        weightDirty
          ? fetch(`/api/v1/pets/${pet.id}/weights`, {
              body: JSON.stringify({
                weightKg: Number(weightKg.toFixed(2)),
              }),
              headers: { "Content-Type": "application/json" },
              method: "PUT",
            })
          : null,
        reminderDirty && !pushFailure
          ? fetch(`/api/v1/pets/${pet.id}/weight-reminder`, {
              body: JSON.stringify({
                ...reminder,
                timezone: "Australia/Melbourne",
              }),
              headers: { "Content-Type": "application/json" },
              method: "PUT",
            })
          : null,
      ]);
      if (
        (weightResponse && !weightResponse.ok) ||
        (reminderResponse && !reminderResponse.ok)
      ) {
        throw new Error("We could not save your changes. Try again.");
      }
      if (weightResponse) {
        const saved = (await weightResponse.json()) as WeightEntryResponse;
        setEntries((current) => [
          ...current.filter((entry) => entry.localDate !== saved.localDate),
          { ...saved, ownerId: pet.ownerId },
        ]);
        setWeightInput(
          formatWeightInput(weightFromKilograms(saved.weightKg, weightUnit)),
        );
        setWeightDirty(false);
      }
      if (reminderResponse) setReminderDirty(false);
      if (pushFailure) {
        setState("error");
        setMessage(
          weightResponse ? `Weight saved. ${pushFailure}` : pushFailure,
        );
        return;
      }
      setState("saved");
      setMessage("Weight and reminder preferences saved.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save your changes. Try again.",
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] pt-[max(1.5rem,env(safe-area-inset-top))] pb-0 text-[#2d2d2d]">
      <header className="flex items-center gap-4 px-6">
        <Link
          aria-label={`Back to ${pet.name}'s profile`}
          className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a] active:scale-[0.97]"
          href={`/pets/${pet.id}`}
        >
          <ArrowLeft aria-hidden="true" className="size-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Log weight</h1>
      </header>

      <section className="mt-5 px-6 text-center">
        <label
          className="sr-only"
          htmlFor="weight-value"
          id="weight-value-label"
        >
          {pet.name}&apos;s weight in{" "}
          {weightUnit === "kg" ? "kilograms" : "pounds"}
        </label>
        <div className="relative flex min-w-0 items-center justify-center overflow-hidden">
          <input
            aria-describedby="weight-last-entry"
            aria-invalid={weightDirty && !validWeight}
            className="w-[5.5ch] max-w-[11rem] min-w-0 bg-transparent text-center text-5xl leading-none font-bold tracking-[-0.045em] outline-none focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-[#65bcb5]"
            id="weight-value"
            inputMode="decimal"
            maxLength={6}
            onBlur={() => {
              if (validWeight) setWeightInput(formatWeightInput(weight));
            }}
            onChange={(event) => {
              setWeightInput(event.target.value.replace(",", "."));
              setWeightDirty(true);
              setState("idle");
            }}
            onFocus={(event) => event.currentTarget.select()}
            type="text"
            value={weightInput}
          />
          <span className="absolute top-1/2 left-1/2 ml-[4.5rem] -translate-y-1/2 text-xl text-[#7a7a7a]">
            {weightUnit}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#7a7a7a]" id="weight-last-entry">
          {formatLastEntry(entries.at(-1), weightUnit)}
        </p>
        <div className="mt-1 flex items-center justify-center gap-5">
          <button
            aria-label={`Reduce weight by 0.1 ${weightUnit}`}
            className="grid size-12 place-items-center rounded-full border border-[#ead9c7] bg-white/65 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97]"
            onClick={() => changeWeight(-0.1)}
            type="button"
          >
            <Minus aria-hidden="true" />
          </button>
          <span className="rounded-full bg-[#f2e8da] px-5 py-2 text-xs font-medium text-[#7a7a7a]">
            0.1 {weightUnit}
          </span>
          <button
            aria-label={`Increase weight by 0.1 ${weightUnit}`}
            className="grid size-12 place-items-center rounded-full border border-[#ead9c7] bg-white/65 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97]"
            onClick={() => changeWeight(0.1)}
            type="button"
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
        {weightDirty && !validWeight ? (
          <p className="mt-2 text-xs text-red-600">
            Enter a weight between 0.01 and {Number(maxWeight.toFixed(2))}{" "}
            {weightUnit}.
          </p>
        ) : null}
      </section>

      <section className="mx-6 mt-4 rounded-3xl bg-white/50 p-3 shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
        <h2 className="text-base font-bold">Weight Trend</h2>
        <div className="mt-2">
          <WeightTrendChart entries={entries} weightUnit={weightUnit} />
        </div>
      </section>

      <section className="mx-6 mt-4 rounded-3xl border border-[#ead9c7] bg-white/55 p-3 shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-[#f2e8da] text-[#ed802a]">
            <Bell aria-hidden="true" className="size-5" />
          </span>
          <h2 className="min-w-0 flex-1 text-base font-semibold">
            Remind me to weigh {pet.name}
          </h2>
          <button
            aria-checked={reminder.enabled}
            aria-label="Weight reminder"
            className={`relative h-8 w-14 rounded-full transition-colors ${reminder.enabled ? "bg-[#65bcb5]" : "bg-stone-300"}`}
            onClick={() => {
              setReminder((current) => ({
                ...current,
                enabled: !current.enabled,
              }));
              setReminderDirty(true);
            }}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${reminder.enabled ? "translate-x-6" : ""}`}
            />
          </button>
        </div>

        {reminder.enabled ? (
          <div className="mt-3 border-t border-[#ead9c7] pt-3">
            <p className="text-xs font-semibold text-[#7a7a7a] uppercase">
              Frequency
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {frequencies.map((frequency) => (
                <button
                  className={`min-h-11 rounded-full border px-1 text-xs ${reminder.frequency === frequency.value ? "border-[#65bcb5] bg-[#65bcb5] text-white" : "border-[#ead9c7] bg-white/60 text-[#7a7a7a]"}`}
                  key={frequency.value}
                  onClick={() => {
                    const nextWeekly =
                      frequency.value === "weekly" ||
                      frequency.value === "fortnightly";
                    setReminder((current) => ({
                      ...current,
                      frequency: frequency.value,
                      scheduleDay: nextWeekly ? 0 : new Date().getDate(),
                    }));
                    setReminderDirty(true);
                  }}
                  type="button"
                >
                  {frequency.label}
                </button>
              ))}
            </div>
            <label className="mt-2 flex min-h-11 items-center justify-between gap-4 text-sm font-medium">
              Time
              <input
                className="min-h-11 rounded-xl bg-transparent px-2 text-right text-sm font-semibold text-[#ed802a]"
                onChange={(event) => {
                  setReminder((current) => ({
                    ...current,
                    localTime: event.target.value,
                  }));
                  setReminderDirty(true);
                }}
                type="time"
                value={reminder.localTime}
              />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium">
              Day
              {weekly ? (
                <select
                  className="min-h-11 rounded-xl bg-transparent px-2 text-right text-sm font-semibold text-[#ed802a]"
                  onChange={(event) => {
                    setReminder((current) => ({
                      ...current,
                      scheduleDay: Number(event.target.value),
                    }));
                    setReminderDirty(true);
                  }}
                  value={reminder.scheduleDay}
                >
                  {weekdays.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label="Day of month"
                  className="min-h-11 w-20 rounded-xl bg-transparent px-2 text-right text-sm font-semibold text-[#ed802a]"
                  max="31"
                  min="1"
                  onChange={(event) => {
                    setReminder((current) => ({
                      ...current,
                      scheduleDay: Number(event.target.value),
                    }));
                    setReminderDirty(true);
                  }}
                  type="number"
                  value={reminder.scheduleDay}
                />
              )}
            </label>
            <p className="mt-1 text-[11px] text-[#7a7a7a]">
              Melbourne time; daylight saving adjusts automatically.
            </p>
          </div>
        ) : null}
      </section>

      {message ? (
        <p
          className={`mx-6 mt-2 text-center text-xs ${state === "error" ? "text-red-600" : "text-[#287f7b]"}`}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      <div className="sticky bottom-0 mt-4 bg-gradient-to-t from-[#fdf8f2] via-[#fdf8f2] to-transparent px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#65bcb5] text-base font-semibold text-white shadow-[0_8px_20px_rgba(101,188,181,0.2)] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#287f7b] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#b9deda] disabled:shadow-none"
          disabled={
            state === "saving" ||
            (!weightDirty && !reminderDirty) ||
            (weightDirty && !validWeight)
          }
          onClick={() => void save()}
          type="button"
        >
          {state === "saving" ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </main>
  );
}
