import {
  weightFromKilograms,
  weightTrendWindow,
  type WeightEntry,
  type WeightUnit,
} from "@petmosphere/domain";

function formatDate(localDate: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${localDate}T12:00:00Z`));
}

export function WeightTrendChart({
  entries,
  weightUnit = "kg",
}: {
  entries: WeightEntry[];
  weightUnit?: WeightUnit;
}) {
  const windowDays = weightTrendWindow(entries);
  const newest = entries.at(-1);
  const cutoff = newest
    ? Date.parse(`${newest.localDate}T00:00:00Z`) -
      (windowDays - 1) * 86_400_000
    : 0;
  const visible = entries.filter(
    (entry) => Date.parse(`${entry.localDate}T00:00:00Z`) >= cutoff,
  );

  if (visible.length === 0) {
    return (
      <svg
        aria-label="No weight trend data yet"
        className="h-28 w-full rounded-2xl border border-[#f0e2d1] bg-white/45"
        role="img"
        viewBox="0 0 300 160"
      >
        {[30, 65, 100, 135].map((y) => (
          <line
            key={y}
            stroke="#eee2d4"
            strokeWidth="1"
            x1="20"
            x2="280"
            y1={y}
            y2={y}
          />
        ))}
        <text fill="#7a7a7a" fontSize="14" textAnchor="middle" x="150" y="87">
          No data yet
        </text>
      </svg>
    );
  }

  const weights = visible.map((entry) => entry.weightKg);
  const minimum = Math.min(...weights);
  const maximum = Math.max(...weights);
  const padding = Math.max((maximum - minimum) * 0.2, 0.2);
  const low = minimum - padding;
  const high = maximum + padding;
  const range = high - low;
  const points = visible.map((entry, index) => ({
    entry,
    x: visible.length === 1 ? 150 : 20 + (index / (visible.length - 1)) * 260,
    y: 128 - ((entry.weightKg - low) / range) * 96,
  }));
  const labelEvery = Math.max(1, Math.ceil(points.length / 4));

  return (
    <figure>
      <svg
        aria-label={`${windowDays}-day weight trend from ${Number(weightFromKilograms(minimum, weightUnit).toFixed(2))} to ${Number(weightFromKilograms(maximum, weightUnit).toFixed(2))} ${weightUnit}.`}
        className="h-32 w-full overflow-visible"
        role="img"
        viewBox="0 0 300 170"
      >
        {[30, 62, 94, 128].map((y) => (
          <line
            key={y}
            stroke="#eee2d4"
            strokeWidth="1"
            x1="20"
            x2="280"
            y1={y}
            y2={y}
          />
        ))}
        {points.length > 1 ? (
          <polyline
            fill="none"
            points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
            stroke="#ed802a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ) : null}
        {points.map(({ entry, x, y }, index) => (
          <g key={entry.id}>
            <circle
              cx={x}
              cy={y}
              fill="#ed802a"
              r={index === points.length - 1 ? 6 : 4}
            />
            {(index % labelEvery === 0 || index === points.length - 1) && (
              <>
                <text
                  fill="#2d2d2d"
                  fontSize="11"
                  textAnchor="middle"
                  x={x}
                  y={Math.max(18, y - 11)}
                >
                  {Number(
                    weightFromKilograms(entry.weightKg, weightUnit).toFixed(2),
                  )}
                </text>
                <text
                  fill="#8a837c"
                  fontSize="10"
                  textAnchor="middle"
                  x={x}
                  y="158"
                >
                  {formatDate(entry.localDate)}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="text-center text-xs text-[#7a7a7a]">
        Last {windowDays} days
      </figcaption>
    </figure>
  );
}
