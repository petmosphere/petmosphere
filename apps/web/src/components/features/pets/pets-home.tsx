import type { ReminderResponse } from "@petmosphere/api-contracts";
import type { HealthLogReminder, Pet } from "@petmosphere/domain";
import { Bell, Check, ChevronRight } from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/features/auth/sign-out-button";
import {
  healthLogObservationDetails,
  healthLogStatusDetails,
} from "@/components/features/health-logs/health-log-status-options";
import type { HomeHealthLogSummary } from "@/lib/health-logs/supabase-health-logs";
import {
  categoryDetails,
  formatReminderDate,
} from "@/components/features/reminders/reminder-ui";
import { AppNav } from "./app-nav";
import { PetAvatar } from "./pet-avatar";

type PetWithPhoto = { pet: Pet; photoUrl: string | null };

function formatReminderTime(localTime: string) {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`2026-01-01T${localTime}:00Z`));
}

function formatLogDate(localDate: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${localDate}T12:00:00Z`));
}

export function PetsHome({
  displayName,
  careReminders = [],
  healthLogs,
  pets,
  reminder,
  today,
}: {
  displayName: string;
  careReminders?: ReminderResponse[];
  healthLogs: HomeHealthLogSummary[];
  pets: PetWithPhoto[];
  reminder: Pick<HealthLogReminder, "enabled" | "localTime"> | null;
  today: string;
}) {
  const currentPet = pets[0];
  if (!currentPet) return null;
  const todayLog = healthLogs.find(
    (healthLog) => healthLog.localDate === today,
  );
  const todayHref = `/pets/${currentPet.pet.id}/health-logs/today`;
  const diaryHref = `/pets/${currentPet.pet.id}/health-logs`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#fdf8f2] pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center justify-between px-6 pt-8">
        <div>
          <p className="text-sm text-stone-500">Welcome back</p>
          <h1 className="text-2xl font-bold">Hello, {displayName}</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="px-6 pt-10">
        <h2 className="text-lg font-bold">Your pets</h2>
        <div className="mt-3 space-y-3">
          {pets.map(({ pet, photoUrl }) => (
            <Link
              className="flex items-center gap-4 rounded-3xl border border-[#f0e2d1] bg-white/60 p-4 shadow-sm transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98]"
              href={`/pets/${pet.id}`}
              key={pet.id}
            >
              <PetAvatar
                className="size-18"
                name={pet.name}
                photoUrl={photoUrl}
                species={pet.species}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xl font-bold">
                  {pet.name}
                </span>
                <span className="mt-1 block truncate text-sm text-stone-500 capitalize">
                  {pet.breed || pet.species}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-stone-400"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-6 mt-7">
        <Link
          aria-label={
            todayLog
              ? `Review today’s health log. ${healthLogStatusDetails[todayLog.status].label} is selected today.`
              : "Record today’s health. No emotion selected."
          }
          className="block rounded-3xl bg-white/60 p-5 shadow-sm transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
          href={todayHref}
        >
          <h2 className="text-center text-lg font-bold">
            How is {currentPet.pet.name} today?
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {Object.entries(healthLogStatusDetails).map(([status, details]) => {
              const selected = todayLog?.status === status;
              return (
                <span
                  className={`relative grid min-h-24 place-items-center rounded-2xl border px-2 py-3 text-center ${selected ? `border-2 ${details.selectedClass}` : "border-[#ead9c7] bg-white/60 text-stone-500"}`}
                  key={status}
                >
                  {selected ? (
                    <Check
                      aria-hidden="true"
                      className="absolute top-2 right-2 size-4"
                      strokeWidth={3}
                    />
                  ) : null}
                  <span>
                    <span
                      aria-hidden="true"
                      className="block text-3xl leading-none"
                    >
                      {details.emoji}
                    </span>
                    <span className="mt-2 block text-sm font-semibold">
                      {details.label}
                      {selected ? (
                        <span className="sr-only">, selected today</span>
                      ) : null}
                    </span>
                  </span>
                </span>
              );
            })}
          </div>
          <p className="mt-4 text-center text-sm leading-6 text-stone-500">
            {todayLog
              ? "Today’s check-in is saved. Tap to review or update it."
              : "Tap to add today’s private check-in."}
          </p>
        </Link>
      </section>

      <section className="mx-6 mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Coming up</h2>
          <Link
            className="text-sm font-semibold text-[#a96225]"
            href="/reminders"
          >
            View all
          </Link>
        </div>
        {careReminders.map((careReminder) => {
          const details = categoryDetails[careReminder.category];
          const Icon = details.Icon;
          return (
            <Link
              className="mt-3 flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
              href={`/reminders/${careReminder.id}`}
              key={careReminder.id}
            >
              <span
                className={`grid size-10 place-items-center rounded-full ${details.colours}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {careReminder.title}
                </span>
                <span className="block text-sm text-stone-500">
                  {formatReminderDate(careReminder.dueDate)}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-stone-400"
              />
            </Link>
          );
        })}
        {reminder?.enabled ? (
          <Link
            className="mt-3 flex min-h-16 items-center gap-3 rounded-2xl bg-white/60 px-4 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
            href={diaryHref}
          >
            <span className="grid size-10 place-items-center rounded-full bg-[#fff0df] text-[#d86f1d]">
              <Bell aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Daily health log</span>
              <span className="block text-sm text-stone-500">
                Reminder at {formatReminderTime(reminder.localTime)}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 text-stone-400"
            />
          </Link>
        ) : careReminders.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No record yet</p>
        ) : null}
      </section>

      <section className="mx-6 mt-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">This week</h2>
          {healthLogs.length > 0 ? (
            <Link
              className="text-sm font-semibold text-[#a96225]"
              href={diaryHref}
            >
              View diary
            </Link>
          ) : null}
        </div>
        {healthLogs.length > 0 ? (
          <ul className="mt-2 divide-y divide-[#ead9c7]">
            {healthLogs.map((healthLog) => {
              const mood = healthLogStatusDetails[healthLog.status];
              return (
                <li className="flex gap-3 py-3" key={healthLog.id}>
                  <span
                    aria-label={`${mood.label} emotion`}
                    className="mt-0.5 text-xl leading-none"
                    role="img"
                  >
                    {mood.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-500">
                      {formatLogDate(healthLog.localDate)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {healthLog.observations.length > 0 ? (
                        healthLog.observations.map((observation) => (
                          <span
                            className="rounded-full bg-[#f4ddc3] px-3 py-1 text-xs font-medium text-[#a96225]"
                            key={observation}
                          >
                            {healthLogObservationDetails[observation].label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-[#f4ddc3] px-3 py-1 text-xs font-medium text-[#a96225]">
                          {mood.label}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No record yet</p>
        )}
      </section>

      <div className="min-h-8 flex-1" />
      <AppNav
        diaryHref={diaryHref}
        profileHref={`/pets/${currentPet.pet.id}`}
        reminderHref="/reminders"
      />
    </main>
  );
}
