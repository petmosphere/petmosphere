import {
  healthLogObservationsByStatus,
  type HealthLogObservation,
  type HealthLogStatus,
} from "@petmosphere/domain";
import { Check } from "lucide-react";

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
  return (
    <fieldset className="mt-7">
      <legend className="text-lg font-bold">What did you notice?</legend>
      <p className="mt-1 text-sm text-stone-500">
        Tap all that apply (optional)
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {healthLogObservationsByStatus[status].map((observation) => {
          const selected = value.includes(observation);
          return (
            <button
              aria-pressed={selected}
              className={`flex min-h-13 items-center gap-2 rounded-full border px-4 text-left font-medium transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98] ${selected ? "border-[#cd9255] bg-[#cd9255] text-white" : "border-[#ead9c7] bg-white text-stone-600"}`}
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
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-md border ${selected ? "border-white bg-white text-[#a96225]" : "border-stone-300"}`}
              >
                {selected ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : null}
              </span>
              {healthLogObservationDetails[observation]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
