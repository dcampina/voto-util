import { cn } from "@/lib/utils";

/** Puntos rellenos: criterios cumplidos. Son cuatro cuando la financiación no aplica. */
export function ConcrecionDots({ total, max = 5, label, className }: { total: number; max?: number; label?: string; className?: string }) {
  return (
    <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("inline-flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-2.5 rounded-full border border-primary",
            i < total ? "bg-primary" : "bg-transparent opacity-40",
          )}
        />
      ))}
    </span>
  );
}
