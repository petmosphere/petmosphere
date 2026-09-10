import type { ReminderResponse } from "@petmosphere/api-contracts";
import type { Pet, WeightEntry, WeightUnit } from "@petmosphere/domain";
import { Check, ChevronRight, Plus } from "lucide-react";
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
import { HomePetSwitcher } from "./home-pet-switcher";
import { PetAvatar } from "./pet-avatar";

type PetWithPhoto = { pet: Pet; photoUrl: string | null };


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
  const hasUpcoming = careReminders.length > 0;

  return (
    <main className="animate-page-enter mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] pb-24 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
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
          </div>
        </div>
        <div className="mt-3">
          <HomePetSwitcher currentPetId={currentPet.pet.id} pets={pets} />
        </div>
      </header>

      <section className="mx-5 mt-6">
        <div className="rounded-3xl bg-white/45 p-4 shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
          <Link
            aria-label={
              todayLog
                ? `Review today’s health log. ${healthLogStatusDetails[todayLog.status].label} is selected today.`
                : "Record today’s health"
            }
            className="flex items-center gap-3"
            href={todayHref}
          >
            <PetAvatar
              className="size-10"
              name={currentPet.pet.name}
              photoUrl={currentPet.photoUrl}
              species={currentPet.pet.species}
            />
            <h2 className="text-lg font-semibold tracking-[-0.015em]">
              How is {currentPet.pet.name} today?
            </h2>
          </Link>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Object.entries(healthLogStatusDetails).map(([status, details]) => {
              const selected = todayLog?.status === status;
              return (
                <Link
                  aria-label={`Log ${details.label}`}
                  className={`relative grid min-h-24 place-items-center rounded-2xl px-2 py-3 text-center transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] ${
                    selected
                      ? `border-2 ${details.selectedClass}`
                      : "bg-white/55 text-[#7a7a7a]"
                  }`}
                  href={`${todayHref}?status=${status}`}
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
                </Link>
              );
            })}
          </div>
        </div>
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

      <AppNav
        diaryHref={diaryHref}
        fixed
        reminderHref={`/reminders?pet=${currentPet.pet.id}`}
      />
    </main>
  );
}
