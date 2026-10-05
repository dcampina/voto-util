"use client";

import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Hemicycle } from "@/components/charts/hemicycle";
import { SeatBar } from "@/components/charts/seat-bar";
import { PartyChip } from "@/components/party-chip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Circunscripcion } from "@/data/elecciones/types";
import type { ResultadoReparto } from "@/domain/dhondt";
import { cn } from "@/lib/utils";
import type { Fila } from "./tipos";

export function Resultados({
  circ,
  filas,
  resultado,
}: {
  circ: Circunscripcion;
  filas: Fila[];
  resultado: ResultadoReparto;
}) {
  const t = useTranslations("simulator");
  const tc = useTranslations("common");
  const format = useFormatter();
  const n = (v: number) => format.number(v);

  const porEscanos = [...filas]
    .filter((f) => f.escanos > 0)
    .sort((a, b) => b.escanos - a.escanos || b.votos - a.votos)
    .map((f) => ({ id: f.codigo, label: f.siglas, color: f.color, seats: f.escanos }));
  const resumen = porEscanos.map((g) => `${g.label} ${tc("seats", { count: g.seats })}`).join(", ");
  const siglas = (id: string) => filas.find((f) => f.codigo === id)?.siglas ?? id;

  return (
    <Card>
      <CardHeader>
        <p className="kicker">{t("resultsTitle")}</p>
        <CardTitle className="text-lg leading-snug">{t("resultSentence", { name: circ.nombre })}</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 tabular">
          <span>{t("validVotes", { count: n(resultado.votosValidos) })}</span>
          {!resultado.esMayoritaria && <span>{t("threshold", { count: n(resultado.votosBarrera) })}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <figure className="mx-auto w-full max-w-sm">
          <Hemicycle
            groups={porEscanos}
            total={circ.escanos}
            label={t("hemicycleAria", { name: circ.nombre, summary: resumen || t("noSeat") })}
          />
          <figcaption className="-mt-2 text-center">
            <span className="text-3xl font-extrabold tracking-tight tabular">{circ.escanos}</span>
            <span className="block kicker">{t("columns.seats")}</span>
          </figcaption>
        </figure>

        <SeatBar groups={porEscanos} total={circ.escanos} label={resumen} />

        {resultado.sinVotos && (
          <Alert>
            <InfoIcon />
            <AlertDescription>{t("noVotes")}</AlertDescription>
          </Alert>
        )}
        {resultado.requiereSorteo && (
          <Alert className="border-warning-foreground/30 bg-warning text-warning-foreground">
            <TriangleAlertIcon />
            <AlertDescription className="text-warning-foreground">
              {t("tie", {
                seat: resultado.requiereSorteo.escano,
                parties: format.list(resultado.requiereSorteo.candidaturas.map(siglas), { type: "conjunction" }),
              })}
            </AlertDescription>
          </Alert>
        )}
        {resultado.esMayoritaria && (
          <Alert>
            <InfoIcon />
            <AlertDescription>{t("majoritarian")}</AlertDescription>
          </Alert>
        )}

        <div role="region" aria-label={t("resultsTitle")} tabIndex={0} className="-mx-1 overflow-x-auto rounded-md px-1">
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.party")}</TableHead>
                <TableHead className="text-right">{t("columns.votes")}</TableHead>
                <TableHead className="text-right">{t("columns.share")}</TableHead>
                <TableHead className="text-right">{t("columns.seats")}</TableHead>
                <TableHead className="text-right">{t("columns.change")}</TableHead>
                <TableHead className="w-24 text-right leading-tight whitespace-normal">{t("columns.next")}</TableHead>
                <TableHead className="w-24 text-right leading-tight whitespace-normal">{t("columns.margin")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => {
                const delta = f.escanos - f.escanosOficiales;
                return (
                  <TableRow key={f.codigo} className={cn(f.excluida && "text-muted-foreground")}>
                    <TableCell className="max-w-44">
                      <div className="flex flex-col items-start gap-1">
                        <PartyChip label={f.siglas} color={f.color} icon={f.icono} className={cn(f.excluida && "opacity-60")} />
                        {f.excluida && (
                          <Badge variant="outline" className="text-[0.65rem]" title={t("belowThresholdLong", { count: n(resultado.votosBarrera) })}>
                            {t("belowThreshold")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular">{n(f.votos)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular">
                      {format.number(f.pct, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-base font-bold tabular">{f.escanos}</TableCell>
                    <TableCell className="text-right tabular">
                      <span
                        aria-label={delta < 0 ? t("changeLess", { delta: -delta }) : t("changeVsOfficial", { delta })}
                        className={cn("text-xs font-semibold", delta === 0 && "text-muted-foreground")}
                      >
                        {delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : "="}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular">
                      <Analisis valor={f.siguiente} texto={(c) => t("nextSeatLong", { count: c })} prefijo="+" />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular">
                      <Analisis valor={f.margen} texto={(c) => t("marginLong", { count: c })} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">{t("analysisNote")}</p>

        <Frontera filas={filas} resultado={resultado} />
      </CardContent>
    </Card>
  );
}

function Analisis({ valor, texto, prefijo = "" }: { valor: number | null; texto: (c: string) => string; prefijo?: string }) {
  const format = useFormatter();
  if (valor === null) return <span className="text-muted-foreground">—</span>;
  const c = format.number(valor);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="rounded-sm underline decoration-dotted underline-offset-4" aria-label={texto(c)}>
          {prefijo}
          {c}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">{texto(c)}</TooltipContent>
    </Tooltip>
  );
}

function Frontera({ filas, resultado }: { filas: Fila[]; resultado: ResultadoReparto }) {
  const t = useTranslations("simulator");
  const format = useFormatter();
  const { frontera, primerExcluido } = resultado;
  if (!frontera) return null;
  const siglas = (id: string) => filas.find((f) => f.codigo === id)?.siglas ?? id;
  const q = (v: number) => format.number(v, { maximumFractionDigits: 2 });

  let texto: string;
  if (resultado.esMayoritaria) {
    texto = t("frontierMajoritarian", {
      party: siglas(frontera.candidaturaId),
      votes: format.number(frontera.valor),
      nextParty: primerExcluido ? siglas(primerExcluido.candidaturaId) : "—",
      nextVotes: primerExcluido ? format.number(primerExcluido.valor) : "0",
    });
  } else if (primerExcluido) {
    texto = t("frontierText", {
      seat: frontera.escano ?? 0,
      party: siglas(frontera.candidaturaId),
      quotient: q(frontera.valor),
      nextParty: siglas(primerExcluido.candidaturaId),
      nextQuotient: q(primerExcluido.valor),
    });
  } else {
    texto = t("frontierTextNoNext", {
      seat: frontera.escano ?? 0,
      party: siglas(frontera.candidaturaId),
      quotient: q(frontera.valor),
    });
  }

  return (
    <aside className="rounded-lg border-l-4 border-primary bg-muted/60 px-4 py-3">
      <p className="kicker text-foreground">{t("frontierTitle")}</p>
      <p className="mt-1 text-sm">{texto}</p>
    </aside>
  );
}
