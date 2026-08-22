"use client";

import type {
  ReminderResponse,
  ReminderStatus,
} from "@petmosphere/api-contracts";
import { isReminderOverdue, type Pet } from "@petmosphere/domain";
import { Bell, Check, ChevronRight, LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AppNav } from "@/components/features/pets/app-nav";
import {
  categoryDetails,
  formatReminderDate,
  formatReminderTime,
} from "./reminder-ui";

const tabs: { label: string; value: ReminderStatus }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" },
];

export function RemindersHome({
  initial,
  pets,
}: {
  initial: Record<ReminderStatus, ReminderResponse[]>;
  pets: Pet[];
}) {
  const [active, setActive] = useState<ReminderStatus>("upcoming");
  const [lists, setLists] = useState(initial);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const touchStart = useRef<number | null>(null);
  const [swipe, setSwipe] = useState<{ delta: number; id: string } | null>(
    null,
  );
  const petNames = new Map(pets.map((pet) => [pet.id, pet.name]));

  useEffect(() => {
    function moveOverdueReminders() {
      setLists((current) => {
        const newlyOverdue = current.upcoming.filter((reminder) =>
          isReminderOverdue(reminder),
        );
        if (newlyOverdue.length === 0) return current;
        const ids = new Set(newlyOverdue.map((reminder) => reminder.id));
        return {
          ...current,
          overdue: [...current.overdue, ...newlyOverdue].sort((a, b) =>
            `${a.dueDate}${a.localTime}`.localeCompare(
              `${b.dueDate}${b.localTime}`,
            ),
          ),
          upcoming: current.upcoming.filter(
            (reminder) => !ids.has(reminder.id),
          ),
        };
      });
    }

    moveOverdueReminders();
    const interval = window.setInterval(moveOverdueReminders, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  async function complete(reminder: ReminderResponse) {
    if (workingId) return;
    setWorkingId(reminder.id);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/reminders/${reminder.id}/complete`,
        { method: "POST" },
      );
      const body = (await response.json()) as {
        completed?: ReminderResponse;
        message?: string;
        next?: ReminderResponse | null;
      };
      if (!response.ok || !body.completed)
        throw new Error(
          body.message ?? "We could not mark this reminder as done.",
        );
      setLists((current) => ({
        completed: [
          body.completed!,
          ...current.completed.filter((item) => item.id !== reminder.id),
        ],
        overdue: current.overdue.filter((item) => item.id !== reminder.id),
        upcoming: body.next
          ? [
              ...current.upcoming.filter((item) => item.id !== reminder.id),
              body.next,
            ].sort((a, b) =>
              `${a.dueDate}${a.localTime}`.localeCompare(
                `${b.dueDate}${b.localTime}`,
              ),
            )
          : current.upcoming.filter((item) => item.id !== reminder.id),
      }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not mark this reminder as done. Try again.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  const reminders = lists[active];
  const firstPetName = pets[0]?.name ?? "your pet";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em]">
          Reminders
        </h1>
        <Link
          aria-label="Add a reminder"
          className="grid size-11 place-items-center rounded-full bg-[#ed802a] text-white shadow-sm transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a95b1e] active:scale-95 motion-reduce:transition-none"
          href="/reminders/new"
        >
          <Plus aria-hidden="true" className="size-6" strokeWidth={2} />
        </Link>
      </header>

      <div
        aria-label="Reminder lists"
        className="mx-6 mt-6 flex items-end justify-between border-b border-transparent"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            aria-selected={active === tab.value}
            className={`relative min-h-12 px-0.5 text-base font-medium transition-colors duration-150 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-1 after:rounded-full after:transition-transform after:duration-150 motion-reduce:transition-none ${active === tab.value ? "text-[#ed802a] after:scale-x-100 after:bg-[#ed802a]" : "text-[#7a7a7a] after:scale-x-0 after:bg-transparent"}`}
            key={tab.value}
            onClick={() => {
              setActive(tab.value);
              setError("");
            }}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section aria-live="polite" className="flex flex-1 flex-col px-6 pt-6">
        {active !== "completed" && reminders.length > 0 ? (
          <p className="mb-4 text-center text-xs text-stone-500">
            Tick the check box to mark as complete
          </p>
        ) : null}
        {error ? (
          <p
            className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {reminders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
            <div
              aria-hidden="true"
              className="grid size-40 place-items-center rounded-full border-2 border-dashed border-[#ed802a]"
            >
              <span className="grid size-24 place-items-center rounded-full bg-[#fff0e3] text-[#ed802a]">
                <Bell className="size-11" strokeWidth={1.7} />
              </span>
            </div>
            <h2 className="mt-9 text-[1.65rem] leading-tight font-bold tracking-[-0.02em]">
              {active === "upcoming"
                ? "No reminders yet"
                : active === "completed"
                  ? "No completed reminders yet"
                  : "No overdue reminders"}
            </h2>
            <p className="mt-4 max-w-[20rem] text-base leading-7 text-[#7a7a7a]">
              {active === "upcoming"
                ? `Stay on top of ${firstPetName}’s health by setting reminders for vaccinations, medications, vet visits, and more.`
                : active === "completed"
                  ? "Reminders you mark as done will appear here."
                  : "Reminders that pass their due date will appear here."}
            </p>
            {active === "upcoming" ? (
              <>
                <Link
                  className="mt-8 inline-flex min-h-14 w-full max-w-[16.5rem] items-center justify-center gap-3 rounded-full bg-[#ed802a] px-6 text-base font-semibold text-white shadow-sm transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a95b1e] active:scale-[0.98] motion-reduce:transition-none"
                  href="/reminders/new"
                >
                  <Plus aria-hidden="true" className="size-5" />
                  Add Your First Reminder
                </Link>
                <p className="mt-3 text-sm text-[#7a7a7a]">
                  It only takes a moment
                </p>
              </>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-3">
            {reminders.map((reminder) => {
              const details = categoryDetails[reminder.category];
              const Icon = details.Icon;
              const busy = workingId === reminder.id;
              return (
                <li
                  className="relative touch-pan-y overflow-hidden rounded-xl bg-[#68c1bc] shadow-[0_4px_16px_rgba(205,146,85,0.08)]"
                  key={reminder.id}
                  onTouchEnd={(event) => {
                    const start = touchStart.current;
                    touchStart.current = null;
                    setSwipe(null);
                    if (
                      active !== "completed" &&
                      start !== null &&
                      event.changedTouches[0]!.clientX - start > 72
                    )
                      void complete(reminder);
                  }}
                  onTouchStart={(event) => {
                    touchStart.current = event.touches[0]!.clientX;
                    setSwipe({ delta: 0, id: reminder.id });
                  }}
                  onTouchMove={(event) => {
                    const start = touchStart.current;
                    if (start === null || active === "completed") return;
                    setSwipe({
                      delta: Math.max(
                        0,
                        Math.min(96, event.touches[0]!.clientX - start),
                      ),
                      id: reminder.id,
                    });
                  }}
                >
                  <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center text-sm font-bold text-white">
                    <Check aria-hidden="true" className="mr-1 size-5" />
                    Done
                  </div>
                  <div
                    className={`relative flex min-h-19 items-center gap-3 bg-[#fffaf5] px-4 py-3 transition-transform ease-out motion-reduce:transition-none ${swipe?.id === reminder.id ? "duration-0" : "duration-150"}`}
                    style={{
                      transform:
                        swipe?.id === reminder.id
                          ? `translateX(${swipe.delta}px)`
                          : undefined,
                    }}
                  >
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-2xl ${details.colours}`}
                    >
                      <Icon aria-hidden="true" className="size-6" />
                    </span>
                    <Link
                      className="min-w-0 flex-1 rounded-lg focus-visible:outline-2 focus-visible:outline-[#ed802a]"
                      href={`/reminders/${reminder.id}`}
                    >
                      <span className="block truncate font-bold">
                        {reminder.title}
                      </span>
                      <span className="mt-1 block text-sm text-stone-500">
                        {petNames.get(reminder.petId) ?? "Your pet"} ·{" "}
                        {formatReminderDate(reminder.dueDate)}
                      </span>
                      <span className="block text-xs text-stone-400">
                        {formatReminderTime(reminder.localTime)}
                      </span>
                    </Link>
                    {active !== "completed" ? (
                      <button
                        aria-label={`Mark ${reminder.title} as done`}
                        className="grid min-h-11 min-w-11 place-items-center rounded-full border border-[#b9dedb] text-[#318783] disabled:opacity-50"
                        disabled={busy}
                        onClick={() => void complete(reminder)}
                        type="button"
                      >
                        {busy ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-5 animate-spin"
                          />
                        ) : (
                          <Check aria-hidden="true" className="size-5" />
                        )}
                      </button>
                    ) : (
                      <ChevronRight
                        aria-hidden="true"
                        className="size-5 text-stone-400"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <AppNav
        active="reminders"
        diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
        profileHref={pets[0] ? `/pets/${pets[0].id}` : undefined}
        reminderHref="/reminders"
      />
    </main>
  );
}
