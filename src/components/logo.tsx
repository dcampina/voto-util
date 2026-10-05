import { cn } from "@/lib/utils";

/** Marca: una urna estilizada como hemiciclo de tres filas y el nombre. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-6">
        <rect width="24" height="24" rx="6" className="fill-primary" />
        <g className="fill-primary-foreground">
          {[
            [5.2, 16.5],
            [6.4, 11.6],
            [9.4, 8.2],
            [14.6, 8.2],
            [17.6, 11.6],
            [18.8, 16.5],
            [9.2, 15.2],
            [12, 11.9],
            [14.8, 15.2],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={1.45} />
          ))}
        </g>
      </svg>
      <span className="text-[1.05rem] leading-none font-extrabold tracking-[-0.03em]">Voto Útil</span>
    </span>
  );
}
