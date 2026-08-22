"use client";

import type { ReminderResponse } from "@petmosphere/api-contracts";
import {
  reminderCategories,
  reminderRepeatRules,
  type Pet,
} from "@petmosphere/domain";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";

import { PetAvatar } from "@/components/features/pets/pet-avatar";
import { enablePushNotifications } from "@/lib/health-logs/push-notifications";
import { categoryDetails, repeatLabels } from "./reminder-ui";

const timezone = "Australia/Melbourne" as const;

export type ReminderPetOption = { pet: Pet; photoUrl: string | null };

function formatDate(value: string) {
  if (!value) return "Select date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year!, month! - 1, day!)));
}

function formatTime(value: string) {
  if (!value) return "Select time";
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hours!, minutes!)));
}

function NativePickerField({
  icon: Icon,
  label,
  min,
  onChange,
  type,
  value,
}: {
  icon: LucideIcon;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  type: "date" | "time";
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = type === "date" ? formatDate(value) : formatTime(value);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Some browsers expose showPicker but restrict it; use their click fallback.
      }
    }
    input.focus();
    input.click();
  }

  return (
    <div>
      <span className="block text-base font-medium">{label}</span>
      <div className="relative mt-2">
        <button
          aria-label={`${label}: ${displayValue}`}
          className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#ead9c7] bg-white/40 px-3 text-left shadow-[0_4px_14px_rgba(205,146,85,0.06)] transition-[border-color,background-color,transform] duration-150 ease-out hover:bg-white/65 focus-visible:border-[#ed802a] focus-visible:ring-2 focus-visible:ring-[#ed802a]/25 focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none"
          onClick={openPicker}
          type="button"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff0e3] text-[#ed802a]">
            <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
          </span>
          <span
            className={`min-w-0 flex-1 text-base ${value ? "font-medium text-[#2d2d2d]" : "text-[#9b9691]"}`}
          >
            {displayValue}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-[#8b8782]"
          />
        </button>
        <input
          ref={inputRef}
          aria-hidden="true"
          className="pointer-events-none absolute size-px opacity-0"
          data-testid={`reminder-${type}-input`}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          tabIndex={-1}
          type={type}
          value={value}
        />
      </div>
    </div>
  );
}

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
            creationRequestId: requestId,
            dueDate,
            localTime,
            note,
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
          <div
            aria-label="Swipe horizontally to see all reminder categories"
            className="mt-3 flex w-full max-w-full snap-x snap-mandatory [scrollbar-width:none] gap-2 overflow-x-auto overscroll-x-contain pb-2 motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden"
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

        <NativePickerField
          icon={CalendarDays}
          label="Date"
          min={today}
          onChange={setDueDate}
          type="date"
          value={dueDate}
        />

        <NativePickerField
          icon={Clock3}
          label="Time"
          onChange={setLocalTime}
          type="time"
          value={localTime}
        />

        <label className="block text-base font-medium">
          Repeat
          <span className="relative mt-2 block">
            <select
              className="min-h-[52px] w-full appearance-none rounded-xl border border-[#ead9c7] bg-transparent px-4 pr-12 text-base focus:border-[#ed802a] focus:ring-1 focus:ring-[#ed802a] focus:outline-none"
              onChange={(event) =>
                setRepeatRule(event.target.value as typeof repeatRule)
              }
              value={repeatRule}
            >
              {reminderRepeatRules.map((value) => (
                <option key={value} value={value}>
                  {repeatLabels[value]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-[#7a7a7a]"
            />
          </span>
        </label>

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
