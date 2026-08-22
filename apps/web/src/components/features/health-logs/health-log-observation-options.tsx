import {
  healthLogObservationsByStatus,
  type HealthLogObservation,
  type HealthLogStatus,
} from "@petmosphere/domain";
import { healthLogObservationDetails } from "./health-log-status-options";

export function HealthLogObservationOptions({
  onChange,
  status,
  value,
}: {
  onChange: (value: HealthLogObservation[]) => void;
  status: HealthLogStatus;
  value: HealthLogObservation[];
}) {
  const allObservations = healthLogObservationsByStatus[status];
  const selectedClass = {
    concerned: "border-[#e87474] bg-[#e87474] text-white",
    doing_well: "border-[#65bcb5] bg-[#65bcb5] text-white",
    something_different: "border-[#d49a55] bg-[#d49a55] text-white",
  }[status];

  return (
    <fieldset className="mt-9">
      <legend className="sr-only">Quick observations (optional)</legend>
      <div className="grid grid-cols-2 gap-3">
        {allObservations.map((observation) => {
          const selected = value.includes(observation);
          return (
            <button
              aria-pressed={selected}
              className={`flex min-h-13 items-center gap-2 rounded-full border px-4 text-left font-medium transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96225] ${
                selected
                  ? "border-[#a96225] bg-[#a96225] text-white"
                  : "border-stone-300 bg-white text-stone-900 hover:border-stone-400"
              }`}
              key={observation}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((item) => item !== observation)
                    : [...value, observation],
                )
              }
              type="button"
            >
              <span aria-hidden="true" className="text-base leading-none">
                {healthLogObservationDetails[observation].emoji}
              </span>
              <span>{healthLogObservationDetails[observation].label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
