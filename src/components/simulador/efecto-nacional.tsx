"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Hemicycle } from "@/components/charts/hemicycle";
import { PartyDot, PartyIcon } from "@/components/party-chip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Circunscripcion, Eleccion } from "@/data/elecciones/types";
import type { ResultadoReparto } from "@/domain/dhondt";
import { agregadoNacional } from "@/domain/escenario";
import { cn } from "@/lib/utils";

export function EfectoNacional({
  eleccion,
  circ,
  resultado,
}: {
  eleccion: Eleccion;
  circ: Circunscripcion;
  resultado: ResultadoReparto;
}) {
  const t = useTranslations("simulator");
  const tc = useTranslations("common");
  const grupos = useMemo(
    () => agregadoNacional(eleccion, { codigoINE: circ.codigoINE, resultado }),
    [eleccion, circ.codigoINE, resultado],
  );
  const total = eleccion.circunscripciones.reduce((s, c) => s + c.escanos, 0);
  const mayoria = Math.floor(total / 2) + 1;
  const visibles = grupos.filter((g) => g.escanos > 0);
  const resumen = visibles.map((g) => `${g.etiqueta} ${tc("seats", { count: g.escanos })}`).join(", ");

  return (
    <Card>
      <CardHeader>
        <p className="kicker">{t("nationalTitle")}</p>
        <CardTitle className="text-base">{t("nationalIntro", { name: circ.nombre })}</CardTitle>
        <CardDescription>{t("orderNote")}</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <figure className="flex flex-col items-center">
          <Hemicycle
            groups={visibles.map((g) => ({ id: g.grupo, label: g.etiqueta, color: g.color, seats: g.escanos }))}
            total={total}
            majority={mayoria}
            label={t("nationalAria", { summary: resumen })}
          />
          <figcaption className="kicker -mt-1">{t("majority", { count: mayoria })}</figcaption>
        </figure>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3 md:grid-cols-2">
          {grupos.map((g) => {
            const delta = g.escanos - g.oficiales;
            return (
              <li key={g.grupo} className="flex items-center gap-2">
                <PartyDot color={g.color} />
                <PartyIcon src={g.icono} />
                <span className="min-w-0 flex-1 truncate font-medium">{g.etiqueta}</span>
                <span className="font-bold tabular">{g.escanos}</span>
                <span
                  className={cn("w-7 text-right text-xs tabular", delta === 0 ? "text-muted-foreground/50" : "font-semibold")}
                  aria-label={delta < 0 ? t("changeLess", { delta: -delta }) : t("changeVsOfficial", { delta })}
                >
                  {delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : "·"}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
