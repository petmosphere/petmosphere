export type WeightUnit = "kg" | "lb";

const poundsPerKilogram = 2.2046226218;

export function weightFromKilograms(weightKg: number, unit: WeightUnit) {
  return unit === "lb" ? weightKg * poundsPerKilogram : weightKg;
}

export function weightToKilograms(weight: number, unit: WeightUnit) {
  return unit === "lb" ? weight / poundsPerKilogram : weight;
}

export function formatWeight(weightKg: number, unit: WeightUnit) {
  return `${Number(weightFromKilograms(weightKg, unit).toFixed(2))} ${unit}`;
}
