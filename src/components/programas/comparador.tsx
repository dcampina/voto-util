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
import { useEffect, useMemo, useRef, useState } from "react";
import { PartyChip, PartyIcon } from "@/components/party-chip";
import { iconoPartido } from "@/data/partidos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const pastilla =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary";

export function Comparador({ datos }: { datos: DatosComparador }) {
  const t = useTranslations("programs");
  const tcat = useTranslations("categories");
  const [categoria, setCategoria] = useState(datos.categorias[0].id);
  const [seleccion, setSeleccion] = useState<string[] | null>(null);
  const partidos = seleccion === null ? datos.partidos : datos.partidos.filter((p) => seleccion.includes(p.id));

  function alternarPartido(id: string) {
    setSeleccion((actual) => {
      if (actual === null) return [id];
      const siguiente = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id];
      if (siguiente.length === 0 || siguiente.length === datos.partidos.length) return null;
      return siguiente;
    });
  }

  return (
    <Tabs value={categoria} onValueChange={setCategoria} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="kicker" id="temas">
            {t("categories")}
          </p>
          <TabsList
            aria-labelledby="temas"
            className="h-auto w-full flex-wrap justify-start gap-x-1 gap-y-2 bg-transparent p-0 group-data-horizontal/tabs:h-auto"
          >
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
        <div className="flex min-w-0 flex-col gap-2">
          <p className="kicker" id="candidaturas">
            {t("partyFilter")}
          </p>
          <div role="group" aria-labelledby="candidaturas" className="flex flex-wrap gap-x-1 gap-y-2">
            <button
              type="button"
              className={pastilla}
              aria-pressed={seleccion === null}
              aria-label={t("allParties")}
              onClick={() => setSeleccion(null)}
            >
              {t("allPartiesShort")}
            </button>
            {datos.partidos.map((p) => (
              <button
                key={p.id}
                type="button"
                className={pastilla}
                aria-pressed={seleccion?.includes(p.id) ?? false}
                title={p.nombre}
                onClick={() => alternarPartido(p.id)}
              >
                <PartyIcon src={iconoPartido(p.id)} className="size-3.5" />
                {p.siglas}
              </button>
            ))}
          </div>
        </div>
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
                  <PartyChip label={p.siglas} color={p.color} icon={iconoPartido(p.id)} className="justify-self-start" />
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

/** Primera columna (w-56) y mínimo de cada candidatura (min-w-52): las dos tablas comparten el mismo ancho. */
const ANCHO_TEMA = "14rem";
const ANCHO_PARTIDO = "13rem";

function anchoTabla(numPartidos: number) {
  return `calc(${ANCHO_TEMA} + ${numPartidos} * ${ANCHO_PARTIDO})`;
}

function Columnas({ partidos }: { partidos: PartidoPrograma[] }) {
  return (
    <colgroup>
      <col style={{ width: ANCHO_TEMA }} />
      {partidos.map((p) => (
        <col key={p.id} />
      ))}
    </colgroup>
  );
}

function enlazarScroll(origen: HTMLDivElement, destino: HTMLDivElement | null) {
  if (!destino || destino.scrollLeft === origen.scrollLeft) return;
  destino.scrollLeft = origen.scrollLeft;
}

/** Escritorio: tabla subtema × candidatura, con la fila de partidos fija al desplazar. Móvil: un bloque por subtema. */
function Matriz({ categoria, partidos }: { categoria: Categoria; partidos: PartidoPrograma[] }) {
  const t = useTranslations("programs");
  const tsub = useTranslations("subtopics");
  const cabeceraRef = useRef<HTMLDivElement>(null);
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const firmaPartidos = partidos.map((p) => p.id).join("\0");
  const ancho = anchoTabla(partidos.length);

  useEffect(() => {
    const cuerpo = cuerpoRef.current;
    const cabecera = cabeceraRef.current;
    if (!cuerpo || !cabecera) return;
    cuerpo.scrollLeft = 0;
    cabecera.scrollLeft = 0;
  }, [firmaPartidos, categoria.id]);

  return (
    <>
      <div data-party-matrix className="hidden md:block">
        <div className="sticky top-[calc(3.5rem+1px)] z-30">
          <div
            ref={cabeceraRef}
            data-party-row
            aria-hidden="true"
            className="overflow-x-auto rounded-t-xl border bg-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(e) => enlazarScroll(e.currentTarget, cuerpoRef.current)}
          >
            <table className="table-fixed border-collapse text-left text-sm" style={{ width: "100%", minWidth: ancho }}>
              <Columnas partidos={partidos} />
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-card p-4 align-bottom shadow-[1px_0_0_var(--border)]">
                    <span className="kicker">{t("subtopic")}</span>
                  </th>
                  {partidos.map((p) => (
                    <th key={p.id} scope="col" className="bg-card p-4 align-bottom">
                      <PartyChip label={p.siglas} color={p.color} icon={iconoPartido(p.id)} />
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {p.ambito === "estatal" ? t("stateWide") : t("regional")}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
        </div>
        <div
          ref={cuerpoRef}
          data-party-body
          role="region"
          aria-label={t("title")}
          tabIndex={0}
          className="relative z-0 overflow-x-auto rounded-b-xl border border-t-0 bg-card"
          onScroll={(e) => enlazarScroll(e.currentTarget, cabeceraRef.current)}
        >
          <table className="table-fixed border-collapse text-left text-sm" style={{ width: "100%", minWidth: ancho }}>
            <Columnas partidos={partidos} />
            <thead className="sr-only">
              <tr>
                <th scope="col">{t("subtopic")}</th>
                {partidos.map((p) => (
                  <th key={p.id} scope="col">
                    {p.siglas} {p.ambito === "estatal" ? t("stateWide") : t("regional")}
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
                    <PartyChip label={p.siglas} color={p.color} icon={iconoPartido(p.id)} className={cn(estado.tipo === "medidas" && "mb-2")} />
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
