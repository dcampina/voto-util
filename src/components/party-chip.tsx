import { textOn } from "@/lib/color";
import { cn } from "@/lib/utils";

/** Siglas sobre el color orientativo de la candidatura: el color nunca va solo. */
export function PartyChip({ label, color, className }: { label: string; color: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full min-w-0 items-center rounded-[5px] px-1.5 text-[0.72rem] leading-none font-bold tracking-tight",
        className,
      )}
      style={{ background: color, color: textOn(color) }}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

export function PartyDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}
