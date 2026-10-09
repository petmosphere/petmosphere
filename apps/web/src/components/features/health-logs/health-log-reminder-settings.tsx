"use client";

import type { HealthLogReminder } from "@petmosphere/api-contracts";
import { Bell, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  enablePushNotifications,
  pushSetupErrorMessages,
} from "@/lib/health-logs/push-notifications";
import { TimePicker, formatTimeLabel } from "@/components/ui/time-picker";
import { useDeviceTimezone } from "@/lib/use-device-timezone";

export function HealthLogReminderSettings({ petId }: { petId: string }) {
  const [reminder, setReminder] = useState<
    Pick<HealthLogReminder, "enabled" | "localTime" | "timezone">
  >({ enabled: false, localTime: "19:00", timezone: "Australia/Melbourne" });
  const deviceTimezone = useDeviceTimezone();
  const [state, setState] = useState<"loading" | "idle" | "saving" | "error">(
    "loading",
  );
  const [configured, setConfigured] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "We could not save the reminder. Try again.",
  );

  useEffect(() => {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void fetch("/api/v1/health-log-reminders", {
      body: JSON.stringify({ petId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("reminder lookup failed");
        const saved = (await response.json()) as HealthLogReminder | null;
        if (saved) {
          setReminder(saved);
          setConfigured(true);
        } else {
          setReminder((current) => ({ ...current, timezone: device }));
        }
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
          setErrorMessage(pushSetupErrorMessages[push.reason]);
          setState("error");
          return;
        }
      }
      const response = await fetch("/api/v1/health-log-reminders", {
        body: JSON.stringify({
          ...reminder,
          petId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) throw new Error("reminder save failed");
      setReminder((await response.json()) as HealthLogReminder);
      setConfigured(true);
      setEditing(false);
      setState("idle");
    } catch {
      setErrorMessage("We could not save the reminder. Try again.");
      setState("error");
    }
  }

  if (!editing) {
    return (
      <section
        className="mt-8 rounded-3xl bg-white/60 p-5 shadow-sm"
        aria-labelledby="daily-reminder-title"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff3e4] text-[#ed802a]">
            <Bell aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold" id="daily-reminder-title">
              Daily check-in notification
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {state === "loading"
                ? "Loading…"
                : state === "error"
                  ? "Could not load settings"
                  : reminder.enabled
                    ? `Enabled · ${formatTimeLabel(reminder.localTime)}`
                    : "Paused"}
            </p>
          </div>
          {state === "idle" && (
            <button
              aria-label="Edit daily check-in notification"
              className="min-h-11 rounded-full border border-[#e8d0b3] px-4 text-sm font-semibold text-[#a96225] focus-visible:outline-2 focus-visible:outline-[#ed802a]"
              onClick={() => setEditing(true)}
              type="button"
            >
              {configured ? "Edit" : "Set up"}
            </button>
          )}
        </div>
      </section>
    );
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
            Daily check-in notification
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-500">
            Get a generic notification at your chosen local time. It never
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
        <div className="mt-4">
          <TimePicker
            label="Reminder time"
            onChange={(localTime) => {
              setReminder((current) => ({ ...current, localTime }));
              setState("idle");
            }}
            value={reminder.localTime}
          />
          <p className="mt-2 text-sm text-stone-500">
            Scheduled in {reminder.timezone.replaceAll("_", " ")} time.
          </p>
          {deviceTimezone && reminder.timezone !== deviceTimezone ? (
            <button
              className="mt-1 min-h-11 text-sm font-semibold text-[#a96225] underline"
              onClick={() =>
                setReminder((current) => ({
                  ...current,
                  timezone: deviceTimezone,
                }))
              }
              type="button"
            >
              Use this device&apos;s time zone ({deviceTimezone})
            </button>
          ) : null}
        </div>
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
      {state === "error" ? (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
