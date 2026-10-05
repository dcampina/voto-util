import Image from "next/image";
import { textOn } from "@/lib/color";
import { cn } from "@/lib/utils";

/** Siglas sobre el color orientativo de la candidatura: el color nunca va solo. */
export function PartyChip({
  label,
  color,
  icon,
  className,
}: {
  label: string;
  color: string;
  icon?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full min-w-0 items-center gap-1 rounded-[5px] px-1.5 text-[0.72rem] leading-none font-bold tracking-tight",
        icon && "pl-1",
        className,
      )}
      style={{ background: color, color: textOn(color) }}
      title={label}
    >
      <PartyIcon src={icon} />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Favicon del partido; decorativo porque siempre va junto a las siglas. */
export function PartyIcon({ src, className }: { src?: string; className?: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      width={16}
      height={16}
      unoptimized
      className={cn("size-4 shrink-0 rounded-[3px] bg-white object-contain p-px ring-1 ring-black/10", className)}
    />
  );
}

export function PartyDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}
