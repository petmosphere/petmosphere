export const healthLogStatuses = [
  "doing_well",
  "something_different",
  "concerned",
] as const;
export const healthLogObservations = [
  "ate_well",
  "playful",
  "ate_less",
  "low_energy",
  "vomited",
  "diarrhoea",
] as const;
export const maxHealthLogImages = 4;

export type HealthLogStatus = (typeof healthLogStatuses)[number];
export type HealthLogObservation = (typeof healthLogObservations)[number];

export const healthLogObservationsByStatus = {
  concerned: ["vomited", "diarrhoea"],
  doing_well: ["ate_well", "playful"],
  something_different: ["ate_less", "low_energy"],
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
