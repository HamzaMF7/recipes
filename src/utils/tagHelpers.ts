const DEFAULT_PALETTE = [
  "bg-amber-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-red-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-cyan-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-sky-600",
  "bg-lime-600",
  "bg-fuchsia-600",
];

const DEFAULT_DARK_SET = new Set([
  "bg-amber-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-red-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-fuchsia-600",
  "bg-emerald-600",
]);

export function getTagInitials(tag: string): string {
  return tag
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

export function getDeterministicTagColor(tag: string, palette: string[] = DEFAULT_PALETTE): string {
  if (palette.length === 0) {
    return "bg-amber-600";
  }

  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
}

export function getTagTextColorClass(colorClass: string, darkColors: Set<string> = DEFAULT_DARK_SET): string {
  return darkColors.has(colorClass) ? "text-white" : "text-black";
}

export const DEFAULT_TAG_COLORS = DEFAULT_PALETTE;
export const DEFAULT_DARK_COLORS = DEFAULT_DARK_SET;

export function extendTagPalette(base: string[] = DEFAULT_PALETTE, additions: string[] = []): string[] {
  return [...base, ...additions];
}

export function extendDarkColors(base: Set<string> = DEFAULT_DARK_SET, additions: string[] = []): Set<string> {
  return new Set([...base, ...additions]);
}
