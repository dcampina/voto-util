"use client";

import {
  GlobeIcon,
  GraduationCapIcon,
  HouseIcon,
  LandmarkIcon,
  LeafIcon,
  ReceiptIcon,
  ScaleIcon,
  StethoscopeIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PartyChip } from "@/components/party-chip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldLabel } from "@/components/ui/field";
import { estadoCelda, mediaCategoria, type Categoria, type DatosComparador, type PartidoPrograma } from "@/domain/programas";
import type { CategoriaKey, SubtemaKey } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { MedidaCard } from "./medida";

const ICONOS: Record<string, LucideIcon> = {
  house: HouseIcon,
  stethoscope: StethoscopeIcon,
  "graduation-cap": GraduationCapIcon,
  scale: ScaleIcon,
  leaf: LeafIcon,
  wallet: WalletIcon,
  receipt: ReceiptIcon,
  globe: GlobeIcon,
  landmark: LandmarkIcon,
};

const TODAS = "__todas";

export function Comparador({ datos }: { datos: DatosComparador }) {
  const t = useTranslations("programs");
  const tcat = useTranslations("categories");
  const [categoria, setCategoria] = useState(datos.categorias[0].id);
  const [filtro, setFiltro] = useState(TODAS);
  const partidos = filtro === TODAS ? datos.partidos : datos.partidos.filter((p) => p.id === filtro);

  return (
    <Tabs value={categoria} onValueChange={setCategoria} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="kicker" id="temas">
            {t("categories")}
          </p>
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <TabsList aria-labelledby="temas" className="h-auto w-max flex-nowrap gap-1 bg-transparent p-0">
              {datos.categorias.map((c) => {
                const Icon = ICONOS[c.icono] ?? LandmarkIcon;
                return (
                  <TabsTrigger
                    key={c.id}
                    value={c.id}
                    className="h-9 flex-none rounded-full border bg-card px-3.5 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon aria-hidden />
                    {tcat(c.id as CategoriaKey)}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>
        <Field className="lg:w-64">
          <FieldLabel htmlFor="filtro-partido">{t("partyFilter")}</FieldLabel>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger id="filtro-partido" className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value={TODAS}>{t("allParties")}</SelectItem>
                {datos.partidos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.siglas}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {datos.categorias.map((c) => (
        <TabsContent key={c.id} value={c.id} className="flex flex-col gap-6">
          <Medias categoria={c} partidos={partidos} />
          <Matriz categoria={c} partidos={partidos} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function Medias({ categoria, partidos }: { categoria: Categoria; partidos: PartidoPrograma[] }) {
  const t = useTranslations("programs");
  const tcat = useTranslations("categories");
  const format = useFormatter();
  const medias = useMemo(
    () =>
      partidos
        .map((p) => ({ p, media: mediaCategoria(categoria, p.id) }))
        .filter((x): x is { p: PartidoPrograma; media: number } => x.media !== null)
        .sort((a, b) => a.p.siglas.localeCompare(b.p.siglas)),
    [categoria, partidos],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("averageTitle", { category: tcat(categoria.id as CategoriaKey) })}</CardTitle>
        <CardDescription>{t("averageIntro")}</CardDescription>
      </CardHeader>
      <CardContent>
        {medias.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAverages")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {medias.map(({ p, media }) => {
              const valor = format.number(media, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
              return (
                <li key={p.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-3">
                  <PartyChip label={p.siglas} color={p.color} className="justify-self-start" />
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={media}
                    aria-valuetext={t("averageValue", { value: valor })}
                    aria-label={p.siglas}
                  >
                    <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(media / 5) * 100}%` }} />
                  </div>
                  <span className="text-right text-sm font-semibold tabular">{valor}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Celda({ categoria, subtemaId, partido, compact }: { categoria: Categoria; subtemaId: string; partido: PartidoPrograma; compact?: boolean }) {
  const t = useTranslations("programs");
  const sub = categoria.subtemas.find((s) => s.id === subtemaId)!;
  const estado = estadoCelda(sub, partido.id);
  if (estado.tipo === "sin-datos") return <p className="text-xs text-muted-foreground">{t("noData")}</p>;
  if (estado.tipo === "sin-mencion") return <p className="text-xs text-muted-foreground italic">{t("noMention")}</p>;
  return (
    <div className="flex flex-col gap-4">
      {estado.medidas.map((m) => (
        <MedidaCard key={m.id} medida={m} partido={partido} compact={compact} />
      ))}
    </div>
  );
}

/** Escritorio: tabla subtema × candidatura. Móvil: un bloque por subtema con tarjetas por candidatura. */
function Matriz({ categoria, partidos }: { categoria: Categoria; partidos: PartidoPrograma[] }) {
  const t = useTranslations("programs");
  const tsub = useTranslations("subtopics");

  return (
    <>
      <div role="region" aria-label={t("title")} tabIndex={0} className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="sticky left-0 z-10 w-56 min-w-56 bg-card p-4 align-bottom">
                <span className="kicker">{t("subtopic")}</span>
              </th>
              {partidos.map((p) => (
                <th key={p.id} scope="col" className="min-w-60 p-4 align-bottom">
                  <PartyChip label={p.siglas} color={p.color} />
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {p.ambito === "estatal" ? t("stateWide") : t("regional")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categoria.subtemas.map((s) => (
              <tr key={s.id} className="border-b last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-card p-4 align-top font-normal shadow-[1px_0_0_var(--border)]">
                  <span className="block font-semibold">{tsub(`${s.id as SubtemaKey}.name`)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{tsub(`${s.id as SubtemaKey}.description`)}</span>
                </th>
                {partidos.map((p) => (
                  <td key={p.id} className="p-4 align-top">
                    <Celda categoria={categoria} subtemaId={s.id} partido={p} compact />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-6 md:hidden">
        {categoria.subtemas.map((s) => (
          <section key={s.id} aria-labelledby={`sub-${s.id}`} className="flex flex-col gap-3">
            <div>
              <h3 id={`sub-${s.id}`} className="font-bold">
                {tsub(`${s.id as SubtemaKey}.name`)}
              </h3>
              <p className="text-xs text-muted-foreground">{tsub(`${s.id as SubtemaKey}.description`)}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {partidos.map((p) => {
                const estado = estadoCelda(s, p.id);
                return (
                  <li
                    key={p.id}
                    className={cn("rounded-lg border bg-card p-3", estado.tipo !== "medidas" && "flex items-center justify-between gap-3 py-2")}
                  >
                    <PartyChip label={p.siglas} color={p.color} className={cn(estado.tipo === "medidas" && "mb-2")} />
                    <Celda categoria={categoria} subtemaId={s.id} partido={p} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
