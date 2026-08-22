import type { HealthLogResponse } from "@petmosphere/api-contracts";
import type { Pet } from "@petmosphere/domain";
import { Check } from "lucide-react";

export function HealthLogSaved({
  healthLog,
  onBackHome,
  onViewDiary,
  pet,
}: {
  healthLog: HealthLogResponse;
  onBackHome: () => void;
  onViewDiary: () => void;
  pet: Pet;
}) {
  return (
    <section
      className="flex min-h-[calc(100dvh-4rem)] flex-col justify-between text-center"
      aria-live="polite"
    >
      <div className="pt-24">
        <div className="mx-auto grid size-30 place-items-center rounded-full bg-[#e0f2f1] shadow-[0_8px_24px_rgba(205,146,85,0.08)]">
          <span className="grid size-22 place-items-center rounded-full bg-[#65bcb5] text-[#fdf8f2]">
            <Check aria-hidden="true" className="size-7" strokeWidth={2} />
          </span>
        </div>
        <h1 className="mt-10 text-2xl font-bold">Log saved!</h1>
        <p className="mx-auto mt-6 max-w-[280px] text-sm leading-[23px] text-[#7a7a7a]">
          {pet.name}’s check-in for{" "}
          {new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(
            new Date(`${healthLog.localDate}T12:00:00`),
          )}{" "}
          has been recorded. Keep tracking to spot trends over time!
        </p>
      </div>
      <div>
        <button
          className="h-[52px] w-full rounded-xl bg-[#65bcb5] text-base font-semibold text-[#fdf8f2] shadow-[0_8px_24px_rgba(205,146,85,0.08)] active:scale-[0.98]"
          onClick={onBackHome}
          type="button"
        >
          Back to home
        </button>
        <button
          className="mt-6 w-full text-[15px] font-medium text-[#726e75] active:scale-[0.98]"
          onClick={onViewDiary}
          type="button"
        >
          View diary
        </button>
      </div>
    </section>
  );
}
