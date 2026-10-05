"use client";

import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/**
 * Campo numérico que permite borrar y reescribir sin saltos: guarda el texto
 * mientras se edita y comunica el valor cuando es válido.
 */
export function NumeroInput({
  id,
  value,
  onCommit,
  label,
  decimals = 0,
  suffix,
  className,
}: {
  id?: string;
  value: number;
  onCommit: (v: number) => void;
  label?: string;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (decimals > 0 ? value.toFixed(decimals) : String(value));

  function parse(text: string): number | null {
    const normal = text.replace(/\s/g, "").replace(",", ".");
    if (normal === "") return null;
    const n = Number(normal);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  return (
    <InputGroup className={cn("w-32", className)}>
      <InputGroupInput
        id={id}
        aria-label={label}
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        value={shown}
        className="text-right font-mono text-sm tabular"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parse(e.target.value);
          if (n !== null) onCommit(n);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const step = (decimals > 0 ? 0.1 : 1) * (e.shiftKey ? (decimals > 0 ? 10 : 1000) : 1);
            const next = Math.max(0, value + (e.key === "ArrowUp" ? step : -step));
            setDraft(null);
            onCommit(next);
          }
        }}
      />
      {suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
