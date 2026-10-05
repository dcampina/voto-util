"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { PartyChip } from "@/components/party-chip";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { votosParaPorcentaje } from "@/domain/escenario";
import { NumeroInput } from "./numero-input";
import type { Fila } from "./tipos";

type Modo = "votos" | "pct";

export function EditorVotos({
  filas,
  votosBlanco,
  votosNulos,
  votosValidos,
  validosOficiales,
  onVotos,
  onBlanco,
  onNulos,
}: {
  filas: Fila[];
  votosBlanco: number;
  votosNulos: number;
  votosValidos: number;
  validosOficiales: number;
  onVotos: (codigo: string, v: number) => void;
  onBlanco: (v: number) => void;
  onNulos: (v: number) => void;
}) {
  const t = useTranslations("simulator");
  const format = useFormatter();
  const [modo, setModo] = useState<Modo>("votos");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("votesTitle")}</CardTitle>
        <CardDescription>{t("votesHint")}</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={modo}
            onValueChange={(v) => v && setModo(v as Modo)}
            aria-label={t("editMode")}
          >
            <ToggleGroupItem value="votos">{t("modeVotes")}</ToggleGroupItem>
            <ToggleGroupItem value="pct" aria-label={t("modePercent")}>
              %
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <ul className="flex flex-col">
          {filas.map((f) => {
            const max = Math.max(100, Math.ceil(f.votosOficiales * 2), Math.ceil(validosOficiales * 0.15));
            const resto = votosValidos - f.votos;
            return (
              <li key={f.codigo} className="flex flex-col gap-2.5 border-b py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <PartyChip label={f.siglas} color={f.color} className="self-start" />
                    <span className="truncate text-xs text-muted-foreground" title={f.denominacion}>
                      {f.denominacion}
                    </span>
                  </div>
                  {modo === "votos" ? (
                    <NumeroInput
                      value={f.votos}
                      onCommit={(v) => onVotos(f.codigo, v)}
                      label={t("votesFor", { party: f.siglas })}
                    />
                  ) : (
                    <NumeroInput
                      value={f.pct * 100}
                      decimals={2}
                      suffix="%"
                      onCommit={(p) => onVotos(f.codigo, votosParaPorcentaje(p, resto))}
                      label={t("percentFor", { party: f.siglas })}
                    />
                  )}
                </div>
                <Slider
                  value={[Math.min(f.votos, max)]}
                  min={0}
                  max={max}
                  step={Math.max(1, Math.round(max / 1000))}
                  onValueChange={([v]) => onVotos(f.codigo, v)}
                  thumbLabel={t("sliderFor", { party: f.siglas })}
                  aria-valuetext={format.number(f.votos)}
                />
              </li>
            );
          })}
        </ul>
        <Separator className="my-2" />
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="votos-blanco">{t("blank")}</FieldLabel>
            <NumeroInput id="votos-blanco" value={votosBlanco} onCommit={onBlanco} className="w-full" />
            <FieldDescription>{t("blankHint")}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="votos-nulos">{t("null")}</FieldLabel>
            <NumeroInput id="votos-nulos" value={votosNulos} onCommit={onNulos} className="w-full" />
            <FieldDescription>{t("nullHint")}</FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
