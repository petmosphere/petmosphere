import type { ReminderResponse } from "@petmosphere/api-contracts";
import type {
  HealthLogReminder,
  Pet,
  WeightEntry,
  WeightUnit,
} from "@petmosphere/domain";
import { Bell, Check, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import {
  healthLogObservationDetails,
  healthLogStatusDetails,
} from "@/components/features/health-logs/health-log-status-options";
import {
  categoryDetails,
  formatReminderDate,
} from "@/components/features/reminders/reminder-ui";
import { HomeWeightTracker } from "@/components/features/weights/home-weight-tracker";
import { NotificationBell } from "@/components/features/notifications/notification-bell";
import type { HomeHealthLogSummary } from "@/lib/health-logs/supabase-health-logs";

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
  careReminders = [],
  currentPetId,
  displayName,
  healthLogs,
  pets,
  reminder,
  today,
  weightEntries = [],
  weightUnit = "kg",
  unreadNotificationCount = 0,
}: {
  careReminders?: ReminderResponse[];
  currentPetId?: string;
  displayName: string;
  healthLogs: HomeHealthLogSummary[];
  pets: PetWithPhoto[];
  reminder: Pick<HealthLogReminder, "enabled" | "localTime"> | null;
  today: string;
  weightEntries?: WeightEntry[];
  weightUnit?: WeightUnit;
  unreadNotificationCount?: number;
}) {
  const currentPet = pets.find(({ pet }) => pet.id === currentPetId) ?? pets[0];
  if (!currentPet) return null;
  const todayLog = healthLogs.find((log) => log.localDate === today);
  const todayHref = `/pets/${currentPet.pet.id}/health-logs/today`;
  const diaryHref = `/pets/${currentPet.pet.id}/health-logs`;
  const hasUpcoming = careReminders.length > 0 || reminder?.enabled;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] pb-24 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="truncate text-2xl leading-none font-bold tracking-[-0.025em]">
              Hello, {displayName}
            </h1>
            <p className="mt-1.5 truncate text-sm text-[#7a7a7a]">
              Here&apos;s {currentPet.pet.name}&apos;s update for today
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell unreadCount={unreadNotificationCount} />
            <Link
              aria-label="Add another pet"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-[#e9ceaf] bg-white/60 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97]"
              href="/pets/new"
            >
              <Plus aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </div>
        <nav
          aria-label="Choose a pet"
          className="-mx-5 mt-3 flex items-center gap-2 overflow-x-auto overscroll-x-contain px-5 pb-1"
        >
          {pets.map(({ pet, photoUrl }) => {
            const selected = pet.id === currentPet.pet.id;
            return (
              <Link
                aria-current={selected ? "true" : undefined}
                aria-label={
                  selected ? `${pet.name}, selected` : `Show ${pet.name}`
                }
                className={`flex min-h-11 shrink-0 items-center rounded-full transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] ${
                  selected
                    ? "max-w-48 gap-1.5 border-2 border-[#ed802a] bg-white/40 pr-3 pl-1"
                    : "border border-[#e9ceaf] bg-white/60 p-1"
                }`}
                href={`/home?pet=${pet.id}`}
                key={pet.id}
              >
                <PetAvatar
                  className="size-9"
                  name={pet.name}
                  photoUrl={photoUrl}
                  species={pet.species}
                />
                {selected ? (
                  <span className="truncate text-sm font-semibold text-[#ed802a]">
                    {pet.name}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <section className="mx-5 mt-6">
        <Link
          aria-label={
            todayLog
              ? `Review today’s health log. ${healthLogStatusDetails[todayLog.status].label} is selected today.`
              : "Record today’s health. No emotion selected."
          }
          className="block rounded-3xl bg-white/45 p-4 shadow-[0_8px_24px_rgba(205,146,85,0.06)] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
          href={todayHref}
        >
          <div className="flex items-center gap-3">
            <PetAvatar
              className="size-10"
              name={currentPet.pet.name}
              photoUrl={currentPet.photoUrl}
              species={currentPet.pet.species}
            />
            <h2 className="text-lg font-semibold tracking-[-0.015em]">
              How is {currentPet.pet.name} today?
            </h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Object.entries(healthLogStatusDetails).map(([status, details]) => {
              const selected = todayLog?.status === status;
              return (
                <span
                  className={`relative grid min-h-24 place-items-center rounded-2xl px-2 py-3 text-center ${
                    selected
                      ? `border-2 ${details.selectedClass}`
                      : "bg-white/55 text-[#7a7a7a]"
                  }`}
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
                      className="block text-2xl leading-none"
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
        </Link>
      </section>

      <HomeWeightTracker
        entries={weightEntries}
        pet={currentPet.pet}
        weightUnit={weightUnit}
      />

      <section className="mx-5 mt-4 rounded-3xl bg-white/45 p-4 shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-[-0.015em]">
            Upcoming Reminders
          </h2>
          {hasUpcoming ? (
            <Link
              className="shrink-0 text-sm font-semibold text-[#ed802a]"
              href="/reminders"
            >
              View All
            </Link>
          ) : null}
        </div>
        {careReminders.map((careReminder) => {
          const details = categoryDetails[careReminder.category];
          const Icon = details.Icon;
          return (
            <Link
              className="mt-2 flex min-h-14 items-center gap-2.5 rounded-2xl bg-white/70 px-3 transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
              href={`/reminders/${careReminder.id}`}
              key={careReminder.id}
            >
              <span
                className={`grid size-9 place-items-center rounded-full ${details.colours}`}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {careReminder.title}
                </span>
                <span className="block text-xs text-[#7a7a7a]">
                  {formatReminderDate(careReminder.dueDate)}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-[#8a837c]"
              />
            </Link>
          );
        })}
        {reminder?.enabled ? (
          <Link
            className="mt-2 flex min-h-14 items-center gap-2.5 rounded-2xl bg-white/70 px-3 transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.99]"
            href={diaryHref}
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#fff0df] text-[#ed802a]">
              <Bell aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                Daily health log
              </span>
              <span className="block text-xs text-[#7a7a7a]">
                Reminder at {formatReminderTime(reminder.localTime)}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 text-[#8a837c]"
            />
          </Link>
        ) : null}
        {!hasUpcoming ? (
          <div className="mt-3">
            <p className="text-base font-medium">No reminders set</p>
            <p className="mt-1 text-xs leading-4 text-[#7a7a7a]">
              Set up reminders for vaccinations, medications, and vet visits
            </p>
            <Link
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ed802a] text-base font-semibold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f0f] active:scale-[0.98]"
              href="/reminders/new"
            >
              <Plus aria-hidden="true" /> Add Reminder
            </Link>
          </div>
        ) : null}
      </section>

      <section className="mx-5 mt-4 rounded-3xl bg-white/45 p-4 shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-[-0.015em]">
            This Week Summary
          </h2>
          {healthLogs.length > 0 ? (
            <Link
              className="text-sm font-semibold text-[#7a7a7a]"
              href={diaryHref}
            >
              History
            </Link>
          ) : null}
        </div>
        {healthLogs.length > 0 ? (
          <ul className="mt-2 divide-y divide-[#ead9c7]">
            {healthLogs.map((healthLog) => {
              const mood = healthLogStatusDetails[healthLog.status];
              return (
                <li className="flex items-start gap-2 py-3" key={healthLog.id}>
                  <p className="min-w-24 text-sm font-medium text-[#7a7a7a]">
                    {formatLogDate(healthLog.localDate)}
                    <span
                      aria-label={`${mood.label} emotion`}
                      className="ml-2 text-lg"
                      role="img"
                    >
                      {mood.emoji}
                    </span>
                  </p>
                  <div className="flex max-h-14 min-w-0 flex-1 flex-wrap justify-end gap-2 overflow-hidden">
                    {(healthLog.observations.length > 0
                      ? healthLog.observations
                      : [null]
                    ).map((observation) => (
                      <span
                        className="rounded-full bg-[#fff0df] px-3 py-1 text-xs font-medium text-[#ed802a]"
                        key={observation ?? mood.label}
                      >
                        {observation
                          ? healthLogObservationDetails[observation].label
                          : mood.label}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3">
            <p className="text-base font-medium">No activity logged yet</p>
            <p className="mt-1 text-xs leading-4 text-[#7a7a7a]">
              Start logging daily check-ins to see {currentPet.pet.name}&apos;s
              weekly summary here
            </p>
          </div>
        )}
      </section>

      <AppNav diaryHref={diaryHref} fixed reminderHref="/reminders" />
    </main>
  );
}
