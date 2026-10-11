"use client";

import { useState } from "react";

import { AppNav } from "@/components/features/pets/app-nav";
import { TimezonePicker } from "@/components/ui/timezone-picker";
import { useDeviceTimezone } from "@/lib/use-device-timezone";

import { ProfileShell } from "./profile-shell";

export function TimezonePreference({
  diaryHref,
  initialTimezone,
}: {
  diaryHref?: string | undefined;
  initialTimezone: string | null;
}) {
  const deviceTimezone = useDeviceTimezone();
  const [savedTimezone, setSavedTimezone] = useState(initialTimezone);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function update(timezone: string | null) {
    setStatus("saving");
    try {
      const response = await fetch("/api/v1/profile/timezone", {
        body: JSON.stringify({ timezone }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) throw new Error();
      setSavedTimezone(timezone);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <ProfileShell title="Time zone">
      <div className="mt-8 rounded-3xl bg-white/70 p-5 shadow-[0_2px_16px_rgba(205,146,85,0.10)]">
        <p className="text-sm leading-6 text-[#7a7a7a]">
          New reminders use this time zone. Existing reminders keep their saved
          time until you edit them.
        </p>
        <div className="mt-5">
          <TimezonePicker
            onChange={(timezone) => void update(timezone)}
            value={savedTimezone ?? deviceTimezone}
          />
        </div>
        {savedTimezone ? (
          <button
            className="mt-4 min-h-11 text-sm font-semibold text-[#a96225] underline disabled:opacity-50"
            disabled={!deviceTimezone || status === "saving"}
            onClick={() => void update(null)}
            type="button"
          >
            Use this device automatically
          </button>
        ) : (
          <p className="mt-4 text-sm text-[#7a7a7a]">
            {deviceTimezone
              ? `Using this device’s time zone (${deviceTimezone}).`
              : "We could not detect this device’s time zone. Choose one above before scheduling notifications."}
          </p>
        )}
        <p
          aria-live="polite"
          className={`mt-4 text-sm ${status === "error" ? "text-red-700" : "text-[#7a7a7a]"}`}
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Time zone saved"
              : status === "error"
                ? "Time zone could not be saved. Try again."
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
