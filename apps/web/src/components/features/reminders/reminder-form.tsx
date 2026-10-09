"use client";

import type { ReminderResponse } from "@petmosphere/api-contracts";
import {
  deriveLocalDate,
  reminderCategories,
  reminderRepeatRules,
  type Pet,
} from "@petmosphere/domain";
import { ChevronRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { DatePicker } from "@/components/ui/date-picker";
import { NotificationLeadSelector } from "@/components/ui/notification-lead-selector";
import { RepeatSelector } from "@/components/ui/repeat-selector";
import { TimePicker } from "@/components/ui/time-picker";
import { PetSelector } from "@/components/ui/pet-selector";
import {
  enablePushNotifications,
  pushSetupErrorMessages,
} from "@/lib/health-logs/push-notifications";
import {
  categoryDetails,
  notificationLeadOptions,
  repeatLabels,
} from "./reminder-ui";
import { RequiredMark } from "@/components/ui/required-mark";
import { useDeviceTimezone } from "@/lib/use-device-timezone";

export type ReminderPetOption = { pet: Pet; photoUrl: string | null };

export function ReminderForm({
  pets,
  reminder,
}: {
  pets: ReminderPetOption[];
  reminder?: ReminderResponse;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(reminder?.category ?? "vaccination");
  const [petId, setPetId] = useState(reminder?.petId ?? pets[0]?.pet.id ?? "");
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? "");
  const [localTime, setLocalTime] = useState(reminder?.localTime ?? "");
  const [notificationLeadMinutes, setNotificationLeadMinutes] = useState<
    number | null
  >(reminder ? reminder.notificationLeadMinutes : 0);
  const [repeatRule, setRepeatRule] = useState(reminder?.repeatRule ?? "never");
  const [note, setNote] = useState(reminder?.note ?? "");
  const [timezoneOverride, setTimezoneOverride] = useState<string | null>(null);
  const deviceTimezone = useDeviceTimezone();
  const timezone =
    timezoneOverride ??
    reminder?.timezone ??
    (deviceTimezone || "Australia/Melbourne");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const today = deriveLocalDate(new Date(), timezone);
  const valid = Boolean(petId && title.trim() && dueDate >= today && localTime);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!valid || state === "saving" || state === "saved") return;
    setState("saving");
    setMessage("");
    try {
      const pushSetup =
        notificationLeadMinutes === null ? null : enablePushNotifications();
      const response = await fetch(
        reminder ? `/api/v1/reminders/${reminder.id}` : "/api/v1/reminders",
        {
          body: JSON.stringify({
            category,
            ...(reminder ? {} : { creationRequestId: requestId }),
            dueDate,
            localTime,
            note,
            notificationLeadMinutes,
            petId,
            repeatRule,
            timezone,
            title,
          }),
          headers: { "Content-Type": "application/json" },
          method: reminder ? "PATCH" : "POST",
        },
      );
      const body = (await response.json()) as
        ReminderResponse | { message?: string };
      if (!response.ok) {
        throw new Error(
          "message" in body ? body.message : "We could not save this reminder.",
        );
      }
      const pushResult = await pushSetup;
      if (pushResult && !pushResult.ok) {
        setState("saved");
        setMessage(
          `Reminder saved, but push notifications are not enabled on this device. ${pushSetupErrorMessages[pushResult.reason]}`,
        );
        return;
      }
      router.push("/reminders");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save this reminder. Try again.",
      );
      setState("error");
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[393px] overflow-x-hidden bg-[#fdf8f2] px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <Link
          className="inline-flex min-h-11 items-center text-base text-[#7a7a7a] focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-[#ed802a]"
          href={reminder ? `/reminders/${reminder.id}` : "/reminders"}
        >
          Cancel
        </Link>
        <h1 className="mt-6 text-[2rem] leading-tight font-bold tracking-[-0.02em]">
          {reminder ? "Edit Reminder" : "New Reminder"}
        </h1>
      </header>

      <form className="mt-8 space-y-6" onSubmit={(event) => void save(event)}>
        <div>
          <span className="block text-sm font-semibold tracking-wide text-[#7a7a7a] uppercase">
            Pet
          </span>
          <div className="mt-3">
            <PetSelector
              label="Pet"
              onChange={setPetId}
              options={pets}
              value={petId}
            />
          </div>
        </div>

        <fieldset className="max-w-full min-w-0">
          <legend className="text-sm font-semibold tracking-wide text-[#7a7a7a] uppercase">
            Reminder category
          </legend>
          <div className="relative mt-3">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 bottom-2 z-10 flex w-12 items-center justify-end rounded-r-xl bg-gradient-to-l from-[#fdf8f2] to-transparent"
            >
              <ChevronRight className="size-4 text-[#ed802a]" />
            </div>
            <div
              aria-label="Swipe horizontally to see all reminder categories"
              className="flex w-full max-w-full snap-x snap-mandatory [scrollbar-width:none] gap-2 overflow-x-auto overscroll-x-contain pb-2 motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden"
            >
              {reminderCategories.map((value) => {
                const { emoji, label } = categoryDetails[value];
                const selected = category === value;
                return (
                  <button
                    aria-pressed={selected}
                    className={`flex min-h-[88px] shrink-0 basis-[calc(33.333%_-_0.333rem)] snap-start flex-col items-center justify-center rounded-xl border px-2 text-sm font-medium whitespace-nowrap transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none ${selected ? "border-2 border-[#ed802a] bg-[#fff7ed]" : "border-[#ead9c7] bg-transparent"}`}
                    key={value}
                    onClick={() => setCategory(value)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="mb-2 text-3xl leading-none"
                    >
                      {emoji}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <label className="block text-base font-medium">
          Title <RequiredMark />
          <input
            className="mt-2 min-h-[52px] w-full rounded-xl border border-[#ead9c7] bg-transparent px-4 text-base placeholder:text-[#b5b5b5] focus:border-[#ed802a] focus:ring-1 focus:ring-[#ed802a] focus:outline-none"
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. NexGard"
            required
            value={title}
          />
        </label>

        <div>
          <span className="block text-base font-medium">
            Date
            <RequiredMark />
          </span>
          <div className="mt-2">
            <DatePicker
              label="Date"
              minDate={new Date(today)}
              onChange={setDueDate}
              placeholder="Select date"
              value={dueDate || undefined}
            />
          </div>
        </div>

        <div>
          <span className="block text-base font-medium">
            Time <RequiredMark />
          </span>
          <div className="mt-2">
            <TimePicker
              label="Time"
              onChange={setLocalTime}
              placeholder="Select time"
              testId="reminder-time-input"
              value={localTime || undefined}
            />
          </div>
          <p className="mt-2 text-sm text-[#7a7a7a]">
            Scheduled in {timezone.replaceAll("_", " ")} time.
          </p>
          {reminder && deviceTimezone && deviceTimezone !== timezone ? (
            <button
              className="mt-2 min-h-11 text-sm font-semibold text-[#a96225] underline"
              onClick={() => setTimezoneOverride(deviceTimezone)}
              type="button"
            >
              Use this device&apos;s time zone ({deviceTimezone})
            </button>
          ) : null}
        </div>

        <div>
          <span className="block text-base font-medium">Notify me</span>
          <div className="mt-2">
            <NotificationLeadSelector
              label="Notify me"
              onChange={setNotificationLeadMinutes}
              options={notificationLeadOptions}
              value={notificationLeadMinutes}
            />
          </div>
        </div>

        <div>
          <span className="block text-base font-medium">Repeat</span>
          <div className="mt-2">
            <RepeatSelector
              label="Repeat"
              onChange={setRepeatRule}
              options={reminderRepeatRules.map((v) => ({
                label: repeatLabels[v],
                value: v,
              }))}
              value={repeatRule}
            />
          </div>
        </div>

        <label className="block text-base font-normal text-[#7a7a7a]">
          Add a note (optional)
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[#ead9c7] bg-transparent p-4 text-base text-[#2d2d2d] placeholder:text-[#b5b5b5] focus:border-[#ed802a] focus:ring-1 focus:ring-[#ed802a] focus:outline-none"
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Any extra details..."
            value={note}
          />
        </label>

        {message ? (
          <p className="text-sm leading-5 text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        {state === "saved" ? (
          <Link
            className="block min-h-11 text-[#ed802a] underline"
            href="/profile/notifications?from=%2Freminders"
          >
            Open notification settings
          </Link>
        ) : null}
        {state === "saved" ? (
          <Link
            className="block min-h-11 text-[#ed802a] underline"
            href="/reminders"
          >
            Return to reminders
          </Link>
        ) : null}
        <button
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#ed802a] text-lg font-semibold text-white shadow-sm disabled:bg-[#f2c59e] disabled:text-white/90"
          disabled={!valid || state === "saving" || state === "saved"}
          type="submit"
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
      </form>
    </main>
  );
}
