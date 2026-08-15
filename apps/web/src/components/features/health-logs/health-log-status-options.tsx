import type {
  HealthLogObservation,
  HealthLogStatus,
} from "@petmosphere/domain";
import { Frown, Laugh, Meh, type LucideIcon } from "lucide-react";

export const healthLogStatusDetails = {
  doing_well: {
    icon: Laugh,
    label: "Great",
    selectedClass: "border-[#62bdb8] bg-[#e8f7f5] text-[#287f7b]",
  },
  something_different: {
    icon: Meh,
    label: "Okay",
    selectedClass: "border-[#d49a55] bg-[#fff3e4] text-[#a96225]",
  },
  concerned: {
    icon: Frown,
    label: "Not good",
    selectedClass: "border-[#e87474] bg-[#fff0ef] text-[#bd3f3f]",
  },
} satisfies Record<
  HealthLogStatus,
  { icon: LucideIcon; label: string; selectedClass: string }
>;

export const healthLogObservationDetails = {
  ate_less: "Ate less",
  ate_well: "Ate well",
  diarrhoea: "Diarrhoea",
  low_energy: "Low energy",
  playful: "Playful",
  vomited: "Vomited",
} satisfies Record<HealthLogObservation, string>;

export function HealthLogStatusOptions({
  error,
  onChange,
  petName,
  value,
}: {
  error?: string;
  onChange: (value: HealthLogStatus) => void;
  petName: string;
  value?: HealthLogStatus;
}) {
  return (
    <fieldset aria-describedby={error ? "health-status-error" : undefined}>
      <legend className="text-lg font-bold">
        How is {petName} feeling?
        <span aria-hidden="true" className="ml-1 text-red-600">
          *
        </span>
      </legend>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {(
          Object.entries(healthLogStatusDetails) as Array<
            [HealthLogStatus, (typeof healthLogStatusDetails)[HealthLogStatus]]
          >
        ).map(([status, details]) => {
          const selected = value === status;
          const Icon = details.icon;
          return (
            <button
              aria-pressed={selected}
              className={`grid min-h-28 place-items-center rounded-2xl border bg-white px-2 py-3 text-center transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98] ${selected ? `border-2 ${details.selectedClass}` : "border-[#ead9c7] text-stone-500"}`}
              key={status}
              onClick={() => onChange(status)}
              type="button"
            >
              <span>
                <Icon
                  aria-hidden="true"
                  className="mx-auto size-9"
                  strokeWidth={1.7}
                />
                <span className="mt-2 block font-semibold">
                  {details.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p
          className="mt-2 text-sm text-red-600"
          id="health-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
