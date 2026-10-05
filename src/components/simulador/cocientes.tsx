"use client";

import { ChevronDownIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { PartyChip } from "@/components/party-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Circunscripcion } from "@/data/elecciones/types";
import type { ResultadoReparto } from "@/domain/dhondt";
import { cn } from "@/lib/utils";
import type { Fila } from "./tipos";

export function Cocientes({
  circ,
  filas,
  resultado,
}: {
  circ: Circunscripcion;
  filas: Fila[];
  resultado: ResultadoReparto;
}) {
  const t = useTranslations("simulator");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const porId = new Map(filas.map((f) => [f.codigo, f]));
  const limite = Math.max(circ.escanos * 2, 20);
  const filasTabla = resultado.cocientes.slice(0, limite);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CardTitle className="text-base">{t("quotientsTitle")}</CardTitle>
          <CardDescription>{t("quotientsIntro")}</CardDescription>
          <div className="pt-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" aria-controls="tabla-cocientes">
                <ChevronDownIcon data-icon="inline-start" className={cn("transition-transform", open && "rotate-180")} />
                {open ? t("hideTable") : t("showTable")}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent id="tabla-cocientes">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div role="region" aria-label={t("quotientsTitle")} tabIndex={0} className="overflow-x-auto rounded-md">
              <Table className="min-w-[32rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">{t("quotientHeaders.rank")}</TableHead>
                    <TableHead>{t("quotientHeaders.party")}</TableHead>
                    <TableHead className="text-right">{t("quotientHeaders.division")}</TableHead>
                    <TableHead className="text-right">{t("quotientHeaders.quotient")}</TableHead>
                    <TableHead className="text-right">{t("quotientHeaders.seat")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasTabla.map((q, i) => {
                    const f = porId.get(q.candidaturaId);
                    const asignado = q.escano !== null;
                    const esFrontera = resultado.frontera === q;
                    return (
                      <TableRow
                        key={`${q.candidaturaId}-${q.divisor}`}
                        data-frontera={esFrontera || undefined}
                        className={cn(
                          !asignado && "text-muted-foreground",
                          asignado && "bg-muted/40",
                          esFrontera && "bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]",
                        )}
                      >
                        <TableCell className="tabular">{i + 1}</TableCell>
                        <TableCell>{f && <PartyChip label={f.siglas} color={f.color} className={cn(!asignado && "opacity-60")} />}</TableCell>
                        <TableCell className="text-right font-mono text-xs tabular">
                          {format.number(f?.votos ?? 0)} ÷ {q.divisor}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular">
                          {format.number(q.valor, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2">
                            {esFrontera && <Badge>{t("frontier")}</Badge>}
                            {asignado ? (
                              <span className="font-semibold tabular">{t("seatNumber", { n: q.escano ?? 0 })}</span>
                            ) : (
                              <span className="sr-only">{t("noSeat")}</span>
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {resultado.cocientes.length > limite && (
              <p className="text-xs text-muted-foreground">
                {t("quotientsTruncated", { shown: limite, total: resultado.cocientes.length })}
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
