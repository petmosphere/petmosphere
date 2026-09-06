"use client";

import type {
  HealthLogResponse,
  HealthLogSummary,
} from "@petmosphere/api-contracts";
import { deriveLocalDate, type Pet } from "@petmosphere/domain";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppNav } from "@/components/features/pets/app-nav";
import { HealthDiaryCalendar } from "./health-diary-calendar";
import { HealthLogDetail } from "./health-log-detail";
import { HealthLogForm } from "./health-log-form";
import { HealthLogReminderSettings } from "./health-log-reminder-settings";
import { HealthLogSaved } from "./health-log-saved";

type View = "calendar" | "detail" | "form" | "saved";

export function HealthDiary({
  initialView = "calendar",
  pet,
  petOptions,
  photoUrl,
}: {
  initialView?: "calendar" | "today";
  pet: Pet;
  petOptions: { pet: Pet; photoUrl: string | null }[];
  photoUrl: string | null;
}) {
  const router = useRouter();
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Melbourne";
  const today = deriveLocalDate(new Date(), timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [summaries, setSummaries] = useState<HealthLogSummary[]>();
  const [view, setView] = useState<View>("calendar");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLog, setSelectedLog] = useState<HealthLogResponse | null>(
    null,
  );
  const [loadingEntry, setLoadingEntry] = useState(initialView === "today");
  const [loadError, setLoadError] = useState<string>();

  const query = useCallback(
    async (body: object) => {
      const response = await fetch("/api/v1/health-logs/query", {
        body: JSON.stringify(body),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (response.status === 401) {
        router.push("/auth/sign-in?next=/home");
        throw new Error("signed out");
      }
      if (!response.ok) throw new Error("health diary query failed");
      return response.json() as Promise<unknown>;
    },
    [router],
  );

  const loadMonth = useCallback(async () => {
    try {
      setSummaries(
        (await query({
          month,
          petId: pet.id,
          scope: "month",
        })) as HealthLogSummary[],
      );
    } catch {
      setLoadError(
        navigator.onLine
          ? "We could not load this month. Try again."
          : "You’re offline. Reconnect to load the diary.",
      );
    }
  }, [month, pet.id, query]);

  const loadDate = useCallback(
    async (date: string) => {
      try {
        const healthLog = (await query({
          localDate: date,
          petId: pet.id,
          scope: "date",
        })) as HealthLogResponse | null;
        setSelectedLog(healthLog);
        setView(healthLog ? "detail" : "form");
      } catch {
        setLoadError("We could not load this entry. Try again.");
      } finally {
        setLoadingEntry(false);
      }
    },
    [pet.id, query],
  );

  function openDate(date: string) {
    setSelectedDate(date);
    setLoadingEntry(true);
    setLoadError(undefined);
    void loadDate(date);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadMonth(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadMonth]);

  useEffect(() => {
    if (initialView !== "today") return;
    const timeout = window.setTimeout(() => void loadDate(today), 0);
    return () => window.clearTimeout(timeout);
  }, [initialView, loadDate, today]);

  function showCalendar() {
    if (initialView === "today") {
      router.push(`/pets/${pet.id}/health-logs`);
      return;
    }
    setView("calendar");
    setSelectedLog(null);
    setSummaries(undefined);

    const selectedMonth = selectedDate.slice(0, 7);
    if (selectedMonth === month) {
      void loadMonth();
    } else {
      setMonth(selectedMonth);
    }
  }

  function changeMonth(nextMonth: string) {
    setLoadError(undefined);
    setSummaries(undefined);
    setMonth(nextMonth);
  }

  function retryMonth() {
    setLoadError(undefined);
    setSummaries(undefined);
    void loadMonth();
  }

  async function removeSelectedLog() {
    if (!selectedLog) return;
    const response = await fetch("/api/v1/health-logs", {
      body: JSON.stringify({ healthLogId: selectedLog.id, petId: pet.id }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    if (!response.ok) throw new Error("health log delete failed");
    setSelectedLog(null);
    if (initialView === "today") {
      router.push(`/pets/${pet.id}/health-logs`);
    } else {
      setView("calendar");
      await loadMonth();
    }
  }

  if (loadingEntry) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 py-8 text-[#2d2d2d]">
        <div
          aria-label="Loading health log"
          className="animate-pulse space-y-5"
          role="status"
        >
          <div className="size-11 rounded-full bg-white" />
          <div className="h-10 w-56 rounded-full bg-[#ead9c7]" />
          <div className="h-40 rounded-3xl bg-white" />
          <div className="h-28 rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  if (view === "saved" && selectedLog) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 py-8 text-[#2d2d2d]">
        <HealthLogSaved
          healthLog={selectedLog}
          onBackHome={() => router.push("/home")}
          onViewDiary={showCalendar}
          pet={pet}
        />
      </main>
    );
  }

  if (view === "detail" && selectedLog) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 py-8 text-[#2d2d2d]">
        <HealthLogDetail
          healthLog={selectedLog}
          onBack={showCalendar}
          onDelete={removeSelectedLog}
          onEdit={() => setView("form")}
          pet={pet}
          photoUrl={photoUrl}
        />
      </main>
    );
  }

  if (view === "form") {
    return (
      <main className="relative mx-auto min-h-dvh w-full max-w-[393px] bg-[#fdf8f2] px-6 py-8 text-[#2d2d2d] sm:my-4 sm:min-h-[852px] sm:rounded-[40px] sm:border sm:border-[#f0e6d8] sm:shadow-[0_8px_24px_rgba(205,146,85,0.08)]">
        <header>
          <button
            aria-label="Cancel health log"
            className="grid size-11 place-items-center rounded-full bg-white active:scale-[0.97]"
            onClick={() => (selectedLog ? setView("detail") : showCalendar())}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <h1 className="mt-7 text-2xl font-bold tracking-tight">
            {selectedLog ? "Update this health log" : "Anything special today?"}
          </h1>
          <p className="mt-2 text-lg text-[#7a7a7a]">Tap all that apply</p>
        </header>
        <section className="mt-5">
          <HealthLogForm
            existing={selectedLog}
            initialDate={selectedDate}
            onCancel={() => (selectedLog ? setView("detail") : showCalendar())}
            onConflict={openDate}
            onPetChange={(petId) =>
              router.push(
                `/pets/${petId}/health-logs${initialView === "today" ? "/today" : ""}`,
              )
            }
            onSaved={(saved) => {
              setSelectedDate(saved.localDate);
              setSelectedLog(saved);
              setView("saved");
              window.scrollTo({ top: 0 });
            }}
            petOptions={petOptions}
            selectedPetId={pet.id}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#fdf8f2] px-6 pt-8 pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      {loadError ? (
        <div
          className="rounded-3xl border border-[#efb3ae] bg-[#fff0ef] p-6 text-center"
          role="alert"
        >
          <p className="text-[#9f342d]">{loadError}</p>
          <button
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-semibold text-[#a96225]"
            onClick={retryMonth}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </button>
        </div>
      ) : summaries ? (
        <>
          <HealthDiaryCalendar
            logs={summaries}
            month={month}
            onAddToday={() => openDate(today)}
            onMonthChange={changeMonth}
            onSelectDate={openDate}
            petName={pet.name}
            today={today}
          />
          <HealthLogReminderSettings petId={pet.id} />
        </>
      ) : (
        <div
          aria-label="Loading health diary"
          className="animate-pulse space-y-5"
          role="status"
        >
          <div className="h-12 w-64 rounded-full bg-[#ead9c7]" />
          <div className="h-96 rounded-3xl bg-white" />
        </div>
      )}
      <div className="min-h-8 flex-1" />
      <AppNav
        active="diary"
        diaryHref={`/pets/${pet.id}/health-logs`}
        reminderHref="/reminders"
      />
    </main>
  );
}
