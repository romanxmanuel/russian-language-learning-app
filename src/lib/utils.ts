import { clsx } from "clsx";

export function cn(...values: Array<string | boolean | null | undefined>) {
  return clsx(values);
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatScore(value: number) {
  return `${Math.round(value * 100)}`;
}

export function toIsoDate(input: Date) {
  return input.toISOString().slice(0, 10);
}
