import type { HealthLogResponse } from "@petmosphere/api-contracts";
import type { Pet } from "@petmosphere/domain";
import { Check } from "lucide-react";

import { healthLogStatusDetails } from "./health-log-status-options";

export function HealthLogSaved({
  healthLog,
  onEdit,
  onViewDiary,
  pet,
}: {
  healthLog: HealthLogResponse;
  onEdit: () => void;
  onViewDiary: () => void;
  pet: Pet;
}) {
  const mood = healthLogStatusDetails[healthLog.status];

  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center text-center" aria-live="polite">
      <div className="mx-auto grid size-32 place-items-center rounded-full bg-[#d9f1ef] text-[#58bdb7] shadow-lg shadow-[#58bdb7]/10">
        <span className="grid size-24 place-items-center rounded-full bg-[#68c1bc] text-white"><Check aria-hidden="true" className="size-12" strokeWidth={1.8} /></span>
      </div>
      <h1 className="mt-8 text-4xl font-bold">Log saved!</h1>
      <p className="mt-3 leading-7 text-stone-500">
        {pet.name}’s check-in for {new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(`${healthLog.localDate}T12:00:00`))} has been recorded.
      </p>
      <div className="mt-7 rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-stone-500">Emotion</p>
        <p className="mt-1 text-2xl font-bold text-[#a96225]">{mood.label}</p>
      </div>
      <div className="mt-8 space-y-3">
        <button className="min-h-13 w-full rounded-2xl border border-[#e8d0b3] bg-white font-semibold text-[#a96225] active:scale-[0.98]" onClick={onEdit} type="button">Edit this log</button>
        <button className="min-h-14 w-full rounded-2xl bg-[#68c1bc] px-5 font-semibold text-white shadow-lg shadow-[#68c1bc]/20 active:scale-[0.98]" onClick={onViewDiary} type="button">View health diary</button>
      </div>
    </section>
  );
}
