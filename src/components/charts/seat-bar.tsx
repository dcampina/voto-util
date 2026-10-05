import { cn } from "@/lib/utils";
import { textOn } from "@/lib/color";
import type { HemicycleGroup } from "./hemicycle";

/** Barra segmentada (como la barra de cobertura de Ground News) con etiquetas dentro. */
export function SeatBar({
  groups,
  total,
  label,
  className,
}: {
  groups: HemicycleGroup[];
  total: number;
  label: string;
  className?: string;
}) {
  const visible = groups.filter((g) => g.seats > 0);
  return (
    <div role="img" aria-label={label} className={cn("flex h-7 w-full overflow-hidden rounded-md bg-seat-empty", className)}>
      {visible.map((g) => {
        const pct = (g.seats / total) * 100;
        return (
          <div
            key={g.id}
            className="flex min-w-0 items-center justify-center overflow-hidden border-r border-card text-[0.68rem] font-bold tabular transition-[width] duration-300 last:border-r-0"
            style={{ width: `${pct}%`, background: g.color, color: textOn(g.color) }}
          >
            {pct >= 7 && (
              <span className="truncate px-1">
                {g.label} {g.seats}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
