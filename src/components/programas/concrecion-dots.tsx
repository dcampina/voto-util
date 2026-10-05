import { cn } from "@/lib/utils";

/** Cinco puntos: los rellenos indican criterios cumplidos. Monocromo para no sugerir valoración. */
export function ConcrecionDots({ total, label, className }: { total: number; label?: string; className?: string }) {
  return (
    <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("inline-flex gap-1", className)}>
      {Array.from({ length: 5 }, (_, i) => (
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
