const FRACTIONS: Record<string, number> = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75 };

export function normalizeAmountToNumber(amount: string | number | null | undefined): number | null {
  if (amount == null) return null;
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;

  const raw = String(amount).trim();
  if (!raw) return null;

  const replaced = raw.replace(/[½⅓⅔¼¾]/g, match => String(FRACTIONS[match] ?? match));
  const parts = replaced.split(/\s+/).filter(Boolean);

  let total = 0;
  for (const part of parts) {
    if (/^\d+\/\d+$/.test(part)) {
      const [numerator, denominator] = part.split("/").map(Number);
      if (!denominator) return null;
      total += numerator / denominator;
      continue;
    }

    const numeric = Number(part);
    if (Number.isFinite(numeric)) {
      total += numeric;
      continue;
    }

    return null;
  }

  return total;
}

export function formatScaledAmount(amount: string | number, scale: number, unit?: string): string {
  const numeric = normalizeAmountToNumber(amount);
  if (numeric == null) {
    return `${amount}${unit ? ` ${unit}` : ""}`;
  }

  const scaled = Math.round(numeric * scale * 100) / 100;
  const display = Number.isInteger(scaled) ? scaled.toString() : scaled.toString();
  return `${display}${unit ? ` ${unit}` : ""}`;
}

export function formatDuration(value?: number | string): string {
  if (value == null || value === "") return "—";

  if (typeof value === "number" && Number.isFinite(value)) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
  }

  const stringValue = String(value);
  if (stringValue.startsWith("PT")) {
    const hours = Number((stringValue.match(/(\d+)H/) || [])[1] || 0);
    const minutes = Number((stringValue.match(/(\d+)M/) || [])[1] || 0);
    return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
  }

  return stringValue;
}

export function formatList(value?: string | string[]): string {
  if (!value) return "";
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
}
