import { cn } from "@/lib/utils";

export interface HemicycleGroup {
  id: string;
  label: string;
  color: string;
  seats: number;
}

interface Seat {
  x: number;
  y: number;
  angle: number;
  row: number;
}

const INNER = 0.38;

/** Distribuye `n` escaños en filas concéntricas de un semicírculo de radio 1. */
function layout(n: number): { seats: Seat[]; r: number } {
  if (n === 1) return { seats: [{ x: 0, y: -0.55, angle: Math.PI / 2, row: 0 }], r: 0.28 };
  let rows = 1;
  for (; rows < 16; rows++) {
    const spacing = (1 - INNER) / rows;
    const capacity = Array.from({ length: rows }, (_, i) => {
      const radius = INNER + spacing * (i + 0.5);
      return Math.floor((Math.PI * radius) / spacing) + 1;
    }).reduce((a, b) => a + b, 0);
    if (capacity >= n) break;
  }
  const spacing = (1 - INNER) / rows;
  const radii = Array.from({ length: rows }, (_, i) => INNER + spacing * (i + 0.5));
  const totalR = radii.reduce((a, b) => a + b, 0);
  // Reparto por restos mayores proporcional a la longitud de cada fila.
  const exact = radii.map((r) => (n * r) / totalR);
  const perRow = exact.map(Math.floor);
  let left = n - perRow.reduce((a, b) => a + b, 0);
  exact
    .map((e, i) => [e - Math.floor(e), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        perRow[i]++;
        left--;
      }
    });

  const seats: Seat[] = [];
  radii.forEach((radius, row) => {
    const k = perRow[row];
    for (let j = 0; j < k; j++) {
      const angle = k === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (k - 1);
      seats.push({ x: radius * Math.cos(angle), y: -radius * Math.sin(angle), angle, row });
    }
  });
  seats.sort((a, b) => b.angle - a.angle || a.row - b.row);
  const r = Math.min(spacing * 0.42, n <= 5 ? 0.16 : 1);
  return { seats, r };
}

export function Hemicycle({
  groups,
  total,
  label,
  majority,
  className,
}: {
  groups: HemicycleGroup[];
  /** Escaños totales; los no asignados se pintan vacíos. */
  total: number;
  label: string;
  majority?: number;
  className?: string;
}) {
  const { seats, r } = layout(Math.max(1, total));
  const colors: (string | null)[] = [];
  for (const g of groups) for (let i = 0; i < g.seats; i++) colors.push(g.color);
  while (colors.length < seats.length) colors.push(null);

  return (
    <svg viewBox="-1.06 -1.08 2.12 1.14" role="img" aria-label={label} className={cn("w-full", className)}>
      {seats.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={r}
          fill={colors[i] ?? undefined}
          className={cn("transition-[fill] duration-300", colors[i] === null && "fill-seat-empty")}
          stroke="var(--card)"
          strokeWidth={r * 0.12}
        />
      ))}
      {majority !== undefined && (
        <line x1={0} y1={-1.06} x2={0} y2={-INNER + 0.06} className="stroke-foreground/50" strokeWidth={0.006} strokeDasharray="0.02 0.02" />
      )}
    </svg>
  );
}
