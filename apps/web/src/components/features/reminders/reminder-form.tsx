"use client";

import type { ReminderResponse } from "@petmosphere/api-contracts";
import {
  reminderCategories,
  reminderRepeatRules,
  type Pet,
} from "@petmosphere/domain";
import { ChevronDown, ChevronRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { DatePicker } from "@/components/ui/date-picker";
import { RepeatSelector } from "@/components/ui/repeat-selector";
import { TimePicker } from "@/components/ui/time-picker";
import { PetAvatar } from "@/components/features/pets/pet-avatar";
import { enablePushNotifications } from "@/lib/health-logs/push-notifications";
import {
  categoryDetails,
  notificationLeadOptions,
  repeatLabels,
} from "./reminder-ui";

const timezone = "Australia/Melbourne" as const;

export type ReminderPetOption = { pet: Pet; photoUrl: string | null };

export function ReminderForm({
  pets,
  reminder,
  today,
}: {
  pets: ReminderPetOption[];
  reminder?: ReminderResponse;
  today: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(reminder?.category ?? "vaccination");
  const [petId, setPetId] = useState(reminder?.petId ?? pets[0]?.pet.id ?? "");
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? "");
  const [localTime, setLocalTime] = useState(reminder?.localTime ?? "");
  const [notificationLeadMinutes, setNotificationLeadMinutes] = useState<
    number | null
  >(reminder?.notificationLeadMinutes ?? 0);
  const [repeatRule, setRepeatRule] = useState(reminder?.repeatRule ?? "never");
  const [note, setNote] = useState(reminder?.note ?? "");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const selectedPet = pets.find((option) => option.pet.id === petId) ?? pets[0];
  const valid = Boolean(petId && title.trim() && dueDate >= today && localTime);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!valid || state === "saving") return;
    setState("saving");
    setMessage("");
    try {
      const pushSetup = enablePushNotifications();
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
      await pushSetup;
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
        <label className="block text-sm font-semibold tracking-wide text-[#7a7a7a] uppercase">
          Pet
          <span className="relative mt-3 flex min-h-16 items-center gap-3 rounded-xl border border-[#ead9c7] px-3 normal-case focus-within:border-[#ed802a] focus-within:ring-1 focus-within:ring-[#ed802a]">
            {selectedPet ? (
              <>
                <PetAvatar
                  className="size-11 border-0"
                  name={selectedPet.pet.name}
                  photoUrl={selectedPet.photoUrl}
                  species={selectedPet.pet.species}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-[#2d2d2d]">
                    {selectedPet.pet.name}
                  </span>
                  <span className="block truncate text-sm font-normal text-[#7a7a7a] capitalize">
                    {selectedPet.pet.breed || selectedPet.pet.species}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 text-[#7a7a7a]"
                />
              </>
            ) : null}
            <select
              aria-label="Pet"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => setPetId(event.target.value)}
              required
              value={petId}
            >
              {pets.map(({ pet }) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </span>
        </label>

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
          Title
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
          <span className="block text-base font-medium">Date</span>
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

        <label className="block text-base font-medium">
          Notify me
          <span className="relative mt-2 block">
            <select
              aria-label="Notify me"
              className="min-h-[52px] w-full appearance-none rounded-xl border border-[#ead9c7] bg-transparent px-4 pr-12 text-base focus:border-[#ed802a] focus:ring-1 focus:ring-[#ed802a] focus:outline-none"
              onChange={(event) =>
                setNotificationLeadMinutes(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              value={
                notificationLeadMinutes === null ? "" : notificationLeadMinutes
              }
            >
              {notificationLeadOptions.map((option) => (
                <option
                  key={option.value === null ? "none" : option.value}
                  value={option.value ?? ""}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-[#7a7a7a]"
            />
          </span>
        </label>

        <div>
          <span className="block text-base font-medium">Time</span>
          <div className="mt-2">
            <TimePicker
              label="Time"
              onChange={setLocalTime}
              placeholder="Select time"
              testId="reminder-time-input"
              value={localTime || undefined}
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
        <button
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#ed802a] text-lg font-semibold text-white shadow-sm disabled:bg-[#f2c59e] disabled:text-white/90"
          disabled={!valid || state === "saving"}
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
