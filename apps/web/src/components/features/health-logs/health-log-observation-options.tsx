import {
  healthLogObservationsByStatus,
  type HealthLogObservation,
  type HealthLogStatus,
} from "@petmosphere/domain";
import {
  healthLogObservationDetails,
  healthLogStatusDetails,
} from "./health-log-status-options";

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
  const { pillClass } = healthLogStatusDetails[status];

  return (
    <fieldset className="mt-6">
      <legend className="mb-2 block text-[14px] font-semibold text-[#7a7a7a]">
        Tags
      </legend>
      <div className="grid grid-cols-2 gap-[10px]">
        {allObservations.map((observation) => {
          const selected = value.includes(observation);
          return (
            <button
              aria-pressed={selected}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-[14px] text-left transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98] ${
                selected
                  ? `${pillClass} border-transparent`
                  : "border-[#f0e6d8] bg-white/60 text-[#2d2d2d]"
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
              <span
                className={`text-[14px] ${selected ? "font-semibold" : "font-medium"}`}
              >
                {healthLogObservationDetails[observation].label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
