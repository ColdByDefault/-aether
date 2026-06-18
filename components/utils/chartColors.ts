export type AvailableChartColorsKeys =
  | "blue"
  | "emerald"
  | "violet"
  | "amber"
  | "gray"
  | "cyan"
  | "pink"
  | "lime"
  | "fuchsia"
  | "rose"
  | "indigo"
  | "orange"
  | "teal"
  | "yellow"
  | "red"
  | "green"
  | "purple"
  | "sky"
  | "slate"
  | "zinc"

export const AvailableChartColors: AvailableChartColorsKeys[] = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "gray",
  "cyan",
  "pink",
  "lime",
  "fuchsia",
  "rose",
  "indigo",
  "orange",
  "teal",
  "yellow",
  "red",
  "green",
  "purple",
  "sky",
  "slate",
  "zinc",
]

export const chartColors: Record<
  AvailableChartColorsKeys,
  { stroke: string; fill: string; bg: string; text: string }
> = {
  blue: {
    stroke: "stroke-blue-500",
    fill: "fill-blue-500",
    bg: "bg-blue-500",
    text: "text-blue-500",
  },
  emerald: {
    stroke: "stroke-emerald-500",
    fill: "fill-emerald-500",
    bg: "bg-emerald-500",
    text: "text-emerald-500",
  },
  violet: {
    stroke: "stroke-violet-500",
    fill: "fill-violet-500",
    bg: "bg-violet-500",
    text: "text-violet-500",
  },
  amber: {
    stroke: "stroke-amber-500",
    fill: "fill-amber-500",
    bg: "bg-amber-500",
    text: "text-amber-500",
  },
  gray: {
    stroke: "stroke-gray-500",
    fill: "fill-gray-500",
    bg: "bg-gray-500",
    text: "text-gray-500",
  },
  cyan: {
    stroke: "stroke-cyan-500",
    fill: "fill-cyan-500",
    bg: "bg-cyan-500",
    text: "text-cyan-500",
  },
  pink: {
    stroke: "stroke-pink-500",
    fill: "fill-pink-500",
    bg: "bg-pink-500",
    text: "text-pink-500",
  },
  lime: {
    stroke: "stroke-lime-500",
    fill: "fill-lime-500",
    bg: "bg-lime-500",
    text: "text-lime-500",
  },
  fuchsia: {
    stroke: "stroke-fuchsia-500",
    fill: "fill-fuchsia-500",
    bg: "bg-fuchsia-500",
    text: "text-fuchsia-500",
  },
  rose: {
    stroke: "stroke-rose-500",
    fill: "fill-rose-500",
    bg: "bg-rose-500",
    text: "text-rose-500",
  },
  indigo: {
    stroke: "stroke-indigo-500",
    fill: "fill-indigo-500",
    bg: "bg-indigo-500",
    text: "text-indigo-500",
  },
  orange: {
    stroke: "stroke-orange-500",
    fill: "fill-orange-500",
    bg: "bg-orange-500",
    text: "text-orange-500",
  },
  teal: {
    stroke: "stroke-teal-500",
    fill: "fill-teal-500",
    bg: "bg-teal-500",
    text: "text-teal-500",
  },
  yellow: {
    stroke: "stroke-yellow-500",
    fill: "fill-yellow-500",
    bg: "bg-yellow-500",
    text: "text-yellow-500",
  },
  red: {
    stroke: "stroke-red-500",
    fill: "fill-red-500",
    bg: "bg-red-500",
    text: "text-red-500",
  },
  green: {
    stroke: "stroke-green-500",
    fill: "fill-green-500",
    bg: "bg-green-500",
    text: "text-green-500",
  },
  purple: {
    stroke: "stroke-purple-500",
    fill: "fill-purple-500",
    bg: "bg-purple-500",
    text: "text-purple-500",
  },
  sky: {
    stroke: "stroke-sky-500",
    fill: "fill-sky-500",
    bg: "bg-sky-500",
    text: "text-sky-500",
  },
  slate: {
    stroke: "stroke-slate-500",
    fill: "fill-slate-500",
    bg: "bg-slate-500",
    text: "text-slate-500",
  },
  zinc: {
    stroke: "stroke-zinc-500",
    fill: "fill-zinc-500",
    bg: "bg-zinc-500",
    text: "text-zinc-500",
  },
}

export function constructCategoryColors(
  categories: string[],
  colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length])
  })
  return categoryColors
}

export function getColorClassName(
  color: AvailableChartColorsKeys,
  type: "stroke" | "fill" | "bg" | "text",
): string {
  return chartColors[color]?.[type] ?? chartColors.blue[type]
}
