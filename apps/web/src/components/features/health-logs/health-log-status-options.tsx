import type {
  HealthLogObservation,
  HealthLogStatus,
} from "@petmosphere/domain";

export const healthLogStatusDetails = {
  doing_well: {
    emoji: "😊",
    label: "Great",
    pillClass: "border-[#62bdb8] bg-[#62bdb8] text-white",
    selectedClass: "border-[#62bdb8] bg-[#e8f7f5] text-[#287f7b]",
  },
  something_different: {
    emoji: "😐",
    label: "Okay",
    pillClass: "border-[#d49a55] bg-[#d49a55] text-white",
    selectedClass: "border-[#d49a55] bg-[#fff3e4] text-[#a96225]",
  },
  concerned: {
    emoji: "😟",
    label: "Not good",
    pillClass: "border-[#f47b20] bg-[#f47b20] text-white",
    selectedClass: "border-[#e87474] bg-[#fff0ef] text-[#bd3f3f]",
  },
} satisfies Record<
  HealthLogStatus,
  {
    emoji: string;
    label: string;
    pillClass: string;
    selectedClass: string;
  }
>;

export const healthLogObservationDetails = {
  ate_less: { emoji: "🍽️", label: "Ate less" },
  ate_well: { emoji: "🍽️", label: "Ate well" },
  bad_breath: { emoji: "🦷", label: "Bad breath" },
  blood_in_stool: { emoji: "🩸", label: "Blood in stool" },
  calm_relaxed: { emoji: "😌", label: "Calm & relaxed" },
  clingy: { emoji: "🤗", label: "Clingy" },
  coughing: { emoji: "😷", label: "Coughing" },
  diarrhoea: { emoji: "💩", label: "Diarrhoea" },
  drank_more: { emoji: "💧", label: "Drank more" },
  drank_normally: { emoji: "💧", label: "Drank normally" },
  enjoyed_walk: { emoji: "🐕", label: "Enjoyed walk" },
  eye_nose_discharge: { emoji: "👁️", label: "Eye/nose discharge" },
  friendly: { emoji: "🐾", label: "Friendly" },
  good_energy: { emoji: "⚡", label: "Good energy" },
  good_poop: { emoji: "💩", label: "Good poop" },
  lethargic: { emoji: "😴", label: "Lethargic" },
  limping: { emoji: "🦵", label: "Limping" },
  low_energy: { emoji: "🪫", label: "Low energy" },
  not_eating: { emoji: "🚫", label: "Not eating" },
  playful: { emoji: "🎾", label: "Playful" },
  restless: { emoji: "😣", label: "Restless" },
  scratching: { emoji: "🐾", label: "Scratching" },
  shaking: { emoji: "🫨", label: "Shaking" },
  shiny_coat: { emoji: "✨", label: "Shiny coat" },
  skipped_treat: { emoji: "🦴", label: "Skipped treat" },
  slept_well: { emoji: "💤", label: "Slept well" },
  slight_limp: { emoji: "🦵", label: "Slight limp" },
  soft_poop: { emoji: "💩", label: "Soft poop" },
  swelling_lump: { emoji: "🔎", label: "Swelling/lump" },
  vomited: { emoji: "🤮", label: "Vomited" },
} satisfies Record<HealthLogObservation, { emoji: string; label: string }>;

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
      <legend className="sr-only">How is {petName} feeling? (required)</legend>
      <div className="grid grid-cols-3 gap-3">
        {(
          Object.entries(healthLogStatusDetails) as Array<
            [HealthLogStatus, (typeof healthLogStatusDetails)[HealthLogStatus]]
          >
        ).map(([status, details]) => {
          const selected = value === status;
          return (
            <button
              aria-pressed={selected}
              className={`grid min-h-16 place-items-center rounded-xl border px-2 py-2 text-center transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98] ${selected ? `border-2 ${details.selectedClass}` : "border-[#e8d0b3] bg-[#fdf8f2] text-[#7a7a7a]"}`}
              key={status}
              onClick={() => onChange(status)}
              type="button"
            >
              <span>
                <span
                  aria-hidden="true"
                  className="block text-2xl leading-none"
                >
                  {details.emoji}
                </span>
                <span className="mt-1 block text-sm font-medium">
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
