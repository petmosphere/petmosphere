export const healthLogStatuses = [
  "doing_well",
  "something_different",
  "concerned",
] as const;
export const healthLogObservations = [
  "ate_well",
  "playful",
  "good_poop",
  "slept_well",
  "friendly",
  "good_energy",
  "shiny_coat",
  "calm_relaxed",
  "drank_normally",
  "enjoyed_walk",
  "ate_less",
  "low_energy",
  "drank_more",
  "soft_poop",
  "scratching",
  "clingy",
  "restless",
  "skipped_treat",
  "slight_limp",
  "bad_breath",
  "vomited",
  "diarrhoea",
  "not_eating",
  "limping",
  "coughing",
  "shaking",
  "lethargic",
  "blood_in_stool",
  "eye_nose_discharge",
  "swelling_lump",
] as const;
export const maxHealthLogImages = 4;

export type HealthLogStatus = (typeof healthLogStatuses)[number];
export type HealthLogObservation = (typeof healthLogObservations)[number];

export const healthLogObservationsByStatus = {
  concerned: [
    "vomited",
    "diarrhoea",
    "not_eating",
    "limping",
    "coughing",
    "shaking",
    "lethargic",
    "blood_in_stool",
    "eye_nose_discharge",
    "swelling_lump",
  ],
  doing_well: [
    "ate_well",
    "playful",
    "good_poop",
    "slept_well",
    "friendly",
    "good_energy",
    "shiny_coat",
    "calm_relaxed",
    "drank_normally",
    "enjoyed_walk",
  ],
  something_different: [
    "ate_less",
    "low_energy",
    "drank_more",
    "soft_poop",
    "scratching",
    "clingy",
    "restless",
    "skipped_treat",
    "slight_limp",
    "bad_breath",
  ],
} as const satisfies Record<HealthLogStatus, readonly HealthLogObservation[]>;

export type HealthLog = {
  createdAt: string;
  derivationTimezone: string;
  id: string;
  imagePaths: string[];
  localDate: string;
  note: string | null;
  observations: HealthLogObservation[];
  ownerId: string;
  petId: string;
  source: "web";
  status: HealthLogStatus;
  updatedAt: string;
};

export function isHealthLogObservationForStatus(
  observation: HealthLogObservation,
  status: HealthLogStatus,
) {
  return (healthLogObservationsByStatus[status] as readonly string[]).includes(
    observation,
  );
}

export type NewHealthLog = Omit<HealthLog, "createdAt" | "updatedAt"> & {
  creationRequestId: string;
};

export type HealthLogReminder = {
  enabled: boolean;
  localTime: string;
  ownerId: string;
  petId: string;
  timezone: string;
  updatedAt: string;
};

export function deriveLocalDate(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}
