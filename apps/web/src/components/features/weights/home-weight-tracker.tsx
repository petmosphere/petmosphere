import {
  formatWeight,
  weightFromKilograms,
  type Pet,
  type WeightEntry,
  type WeightUnit,
} from "@petmosphere/domain";
import { Plus } from "lucide-react";
import Link from "next/link";

function formatDate(localDate: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${localDate}T12:00:00Z`));
}

function Sparkline({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null;
  const recent = entries.slice(-12);
  const weights = recent.map((entry) => entry.weightKg);
  const low = Math.min(...weights);
  const range = Math.max(Math.max(...weights) - low, 0.1);
  const points = recent
    .map((entry, index) => {
      const x = 2 + (index / (recent.length - 1)) * 96;
      const y = 30 - ((entry.weightKg - low) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      aria-label="Recent weight trend"
      className="h-10 w-24"
      role="img"
      viewBox="0 0 100 36"
    >
      <polyline
        fill="none"
        points={points}
        stroke="#65bcb5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function HomeWeightTracker({
  entries,
  pet,
  weightUnit = "kg",
}: {
  entries: WeightEntry[];
  pet: Pet;
  weightUnit?: WeightUnit;
}) {
  const latest = entries.at(-1);
  const monthPrefix = latest?.localDate.slice(0, 7);
  const monthEntries = entries.filter((entry) =>
    entry.localDate.startsWith(monthPrefix ?? ""),
  );
  const change =
    monthEntries.length > 1
      ? latest!.weightKg - monthEntries[0]!.weightKg
      : null;

  return (
    <section className="mx-5 mt-4 rounded-3xl bg-white/45 p-4 shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold tracking-[-0.015em]">
          Weight Tracker
        </h2>
        {change !== null ? (
          <p className="text-xs text-[#7a7a7a]">
            <span className="font-semibold text-[#65bcb5]">
              {change > 0 ? "+" : ""}
              {weightFromKilograms(change, weightUnit).toFixed(1)} {weightUnit}
            </span>{" "}
            this month
          </p>
        ) : null}
      </div>
      {latest ? (
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-[-0.03em]">
              {formatWeight(latest.weightKg, weightUnit).split(" ")[0]}{" "}
              <span className="text-lg font-medium text-[#7a7a7a]">
                {weightUnit}
              </span>
            </p>
            <p className="mt-1 text-xs text-[#7a7a7a]">
              Last recorded on {formatDate(latest.localDate)}
            </p>
          </div>
          <Sparkline entries={entries} />
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-base font-medium">No entries yet</p>
          <p className="mt-1 text-xs text-[#7a7a7a]">
            Track {pet.name}&apos;s weight to see trends over time
          </p>
        </div>
      )}
      <Link
        className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#65bcb5] text-base font-semibold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#287f7b] active:scale-[0.98]"
        href={`/pets/${pet.id}/weight`}
      >
        <Plus aria-hidden="true" /> Log Weight
      </Link>
    </section>
  );
}
