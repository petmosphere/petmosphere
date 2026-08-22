"use client";

import type { ReminderResponse } from "@petmosphere/api-contracts";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  Pencil,
  Repeat2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  categoryDetails,
  formatReminderDate,
  formatReminderTime,
  repeatLabels,
} from "./reminder-ui";

export function ReminderDetail({
  petName,
  reminder,
}: {
  petName: string;
  reminder: ReminderResponse;
}) {
  const router = useRouter();
  const [action, setAction] = useState<"idle" | "completing" | "deleting">(
    "idle",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const details = categoryDetails[reminder.category];
  const Icon = details.Icon;
  const active = !reminder.completedAt;

  async function complete() {
    setAction("completing");
    setError("");
    try {
      const response = await fetch(
        `/api/v1/reminders/${reminder.id}/complete`,
        { method: "POST" },
      );
      if (!response.ok)
        throw new Error("We could not mark this reminder as done.");
      router.push("/reminders");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Try again.");
      setAction("idle");
    }
  }

  async function remove() {
    setAction("deleting");
    setError("");
    try {
      const response = await fetch(`/api/v1/reminders/${reminder.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("We could not delete this reminder.");
      router.push("/reminders");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Try again.");
      setAction("idle");
      setConfirmDelete(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 pb-12 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex min-h-20 items-center justify-between">
        <Link
          aria-label="Back to reminders"
          className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
          href="/reminders"
        >
          <ArrowLeft aria-hidden="true" />
        </Link>
        <div className="flex gap-1">
          {active ? (
            <>
              <Link
                aria-label="Edit reminder"
                className="grid size-11 place-items-center rounded-full text-[#d86f1d] focus-visible:outline-2 focus-visible:outline-[#ed802a]"
                href={`/reminders/${reminder.id}/edit`}
              >
                <Pencil aria-hidden="true" className="size-5" />
              </Link>
              <button
                aria-label="Delete reminder"
                className="grid size-11 place-items-center rounded-full text-red-600 focus-visible:outline-2 focus-visible:outline-red-500"
                onClick={() => setConfirmDelete(true)}
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-5" />
              </button>
            </>
          ) : null}
        </div>
      </header>
      <section className="pt-8 text-center">
        <span
          className={`mx-auto grid size-24 place-items-center rounded-[2rem] ${details.colours}`}
        >
          <Icon aria-hidden="true" className="size-11" />
        </span>
        <p className="mt-5 text-sm font-semibold text-[#a95b1e]">
          {details.label}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{reminder.title}</h1>
        {reminder.completedAt ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#e8f7f5] px-4 py-2 text-sm font-semibold text-[#287f7b]">
            <Check aria-hidden="true" className="size-4" />
            Completed
          </p>
        ) : null}
      </section>
      <dl className="mt-9 divide-y divide-[#eee1d2] rounded-3xl bg-white px-5 shadow-sm">
        <Row
          icon={CalendarDays}
          label="Due"
          value={formatReminderDate(reminder.dueDate)}
        />
        <Row
          icon={Clock3}
          label="Time"
          value={formatReminderTime(reminder.localTime)}
        />
        <Row
          icon={Repeat2}
          label="Repeats"
          value={repeatLabels[reminder.repeatRule]}
        />
        <Row icon={Icon} label="Pet" value={petName} />
      </dl>
      {reminder.note ? (
        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-500">Note</h2>
          <p className="mt-2 leading-6 whitespace-pre-wrap">{reminder.note}</p>
        </section>
      ) : null}
      {error ? (
        <p className="mt-5 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {active ? (
        <button
          className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#68c1bc] font-bold text-white disabled:opacity-50"
          disabled={action !== "idle"}
          onClick={() => void complete()}
          type="button"
        >
          {action === "completing" ? (
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="size-5" />
          )}
          Mark as Done
        </button>
      ) : null}

      {confirmDelete ? (
        <div
          aria-labelledby="delete-reminder-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-4 sm:place-items-center"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-[2rem] bg-[#fdf8f2] p-6 shadow-xl">
            <h2 className="text-xl font-bold" id="delete-reminder-title">
              Delete this reminder?
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              This cancels the current and future occurrence. Completed reminder
              history is kept.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="min-h-12 rounded-2xl border border-[#ead9c7] bg-white font-semibold"
                disabled={action === "deleting"}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#d95d52] font-semibold text-white"
                disabled={action === "deleting"}
                onClick={() => void remove()}
                type="button"
              >
                {action === "deleting" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-5 animate-spin"
                  />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 py-3">
      <Icon aria-hidden="true" className="size-5 text-[#ed802a]" />
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="ml-auto max-w-[55%] text-right font-medium">{value}</dd>
    </div>
  );
}
