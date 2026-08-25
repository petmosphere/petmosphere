"use client";

import type { HealthLogReminder } from "@petmosphere/api-contracts";
import { Bell, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { enablePushNotifications } from "@/lib/health-logs/push-notifications";

const MELBOURNE_TIMEZONE = "Australia/Melbourne";

const pushErrorMessages = {
  configuration: "Push notifications are not configured in this environment.",
  denied:
    "Notifications are blocked. Allow them in your browser settings, then try again.",
  save: "We could not enable notifications on this device. Try again.",
  unsupported:
    "Push notifications are unavailable here. On iPhone or iPad, install Petmosphere to your Home Screen and open it there.",
} as const;

export function HealthLogReminderSettings({ petId }: { petId: string }) {
  const [reminder, setReminder] = useState<
    Pick<HealthLogReminder, "enabled" | "localTime">
  >({ enabled: false, localTime: "19:00" });
  const [state, setState] = useState<
    "loading" | "idle" | "saving" | "saved" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState(
    "We could not save the reminder. Try again.",
  );

  useEffect(() => {
    void fetch("/api/v1/health-log-reminders", {
      body: JSON.stringify({ petId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("reminder lookup failed");
        const saved = (await response.json()) as HealthLogReminder | null;
        if (saved) setReminder(saved);
        setState("idle");
      })
      .catch(() => setState("error"));
  }, [petId]);

  async function save() {
    setState("saving");
    try {
      if (reminder.enabled) {
        const push = await enablePushNotifications();
        if (!push.ok) {
          setErrorMessage(pushErrorMessages[push.reason]);
          setState("error");
          return;
        }
      }
      const response = await fetch("/api/v1/health-log-reminders", {
        body: JSON.stringify({
          ...reminder,
          petId,
          timezone: MELBOURNE_TIMEZONE,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) throw new Error("reminder save failed");
      setReminder((await response.json()) as HealthLogReminder);
      setState("saved");
    } catch {
      setErrorMessage("We could not save the reminder. Try again.");
      setState("error");
    }
  }

  return (
    <section
      className="mt-8 rounded-3xl bg-white/60 p-5 shadow-sm"
      aria-labelledby="daily-reminder-title"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff3e4] text-[#ed802a]">
          <Bell aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold" id="daily-reminder-title">
            Daily check-in reminder
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-500">
            Get a generic notification at your chosen Melbourne time. It never
            includes health details, and we skip it when today&apos;s log
            already exists.
          </p>
        </div>
        <button
          aria-checked={reminder.enabled}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${reminder.enabled ? "bg-[#68c1bc]" : "bg-stone-300"}`}
          disabled={state === "loading"}
          onClick={() => {
            setReminder((current) => ({
              ...current,
              enabled: !current.enabled,
            }));
            setState("idle");
          }}
          role="switch"
          type="button"
        >
          <span
            className={`absolute top-1 size-6 rounded-full bg-white shadow transition-transform ${reminder.enabled ? "left-1 translate-x-6" : "left-1"}`}
          />
        </button>
      </div>
      {reminder.enabled ? (
        <label className="mt-4 flex items-center justify-between gap-3 text-sm font-medium">
          Reminder time
          <input
            className="min-h-11 rounded-xl border border-[#ead9c7] bg-white/60 px-3"
            onChange={(event) => {
              setReminder((current) => ({
                ...current,
                localTime: event.target.value,
              }));
              setState("idle");
            }}
            type="time"
            value={reminder.localTime}
          />
          <span className="sr-only">
            Melbourne time; daylight saving adjusts automatically.
          </span>
        </label>
      ) : null}
      <button
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e8d0b3] font-semibold text-[#a96225] disabled:opacity-50"
        disabled={state === "loading" || state === "saving"}
        onClick={() => void save()}
        type="button"
      >
        {state === "saving" ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save reminder"
        )}
      </button>
      {state === "saved" ? (
        <p className="mt-2 text-center text-sm text-[#287f7b]" role="status">
          Reminder preference saved.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
