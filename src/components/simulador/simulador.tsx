"use client";

import { CheckIcon, Link2Icon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ELECCION_ACTUAL, grupoDe } from "@/data/elecciones";
import { margenUltimoEscano, repartir, votosParaSiguienteEscano } from "@/domain/dhondt";
import {
  codificarEscenario,
  decodificarEscenario,
  entradaDesde,
  hayEdiciones,
  resultadoOficial,
  SIN_EDICIONES,
  type Ediciones,
} from "@/domain/escenario";
import { Cocientes } from "./cocientes";
import { EditorVotos } from "./editor-votos";
import { EfectoNacional } from "./efecto-nacional";
import { Resultados } from "./resultados";
import type { Fila } from "./tipos";

const ELECCION = ELECCION_ACTUAL;
const CIRC_POR_DEFECTO = "28";

export function Simulador() {
  return (
    <Suspense fallback={<SimuladorCargando />}>
      <SimuladorDesdeUrl />
    </Suspense>
  );
}

function SimuladorCargando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[32rem] w-full" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    </div>
  );
}

// La web es estática: el escenario compartido solo puede leerse en el cliente.
function SimuladorDesdeUrl() {
  const query = useSearchParams().toString();
  const [inicial] = useState(() => decodificarEscenario(query, ELECCION));
  return <SimuladorEscenario inicial={inicial} />;
}

function SimuladorEscenario({ inicial }: { inicial: ReturnType<typeof decodificarEscenario> }) {
  const t = useTranslations("simulator");
  const [codigoINE, setCodigoINE] = useState(inicial?.circ.codigoINE ?? CIRC_POR_DEFECTO);
  const [ediciones, setEdiciones] = useState<Ediciones>(inicial?.ediciones ?? SIN_EDICIONES);
  const [copiado, setCopiado] = useState(false);

  const circ = useMemo(
    () => ELECCION.circunscripciones.find((c) => c.codigoINE === codigoINE) ?? ELECCION.circunscripciones[0],
    [codigoINE],
  );

  useEffect(() => {
    const tocado = hayEdiciones(ediciones) || codigoINE !== CIRC_POR_DEFECTO;
    const query = tocado ? `?${codificarEscenario(circ, ediciones)}` : "";
    if (query !== window.location.search) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${query}${window.location.hash}`);
    }
  }, [circ, codigoINE, ediciones]);

  const entrada = useMemo(() => entradaDesde(circ, ediciones), [circ, ediciones]);
  const resultado = useMemo(() => repartir(entrada), [entrada]);
  const oficial = resultadoOficial(circ);
  const modificado = hayEdiciones(ediciones);

  // El análisis «un escaño más / margen» repite el reparto muchas veces: se difiere.
  const entradaDiferida = useDeferredValue(entrada);
  const analisis = useMemo(() => {
    const out: Record<string, { siguiente: number | null; margen: number | null }> = {};
    for (const c of entradaDiferida.candidaturas) {
      out[c.id] = {
        siguiente: votosParaSiguienteEscano(entradaDiferida, c.id),
        margen: margenUltimoEscano(entradaDiferida, c.id),
      };
    }
    return out;
  }, [entradaDiferida]);

  const filas: Fila[] = useMemo(
    () =>
      circ.candidaturas.map((x) => {
        const grupo = grupoDe(ELECCION, x.cabeceraNacional, x.siglas);
        const votos = ediciones.votos[x.codigo] ?? x.votos;
        return {
          codigo: x.codigo,
          siglas: x.siglas,
          denominacion: x.denominacion,
          color: grupo.color,
          votos,
          votosOficiales: x.votos,
          escanos: resultado.escanos[x.codigo] ?? 0,
          escanosOficiales: oficial.escanos[x.codigo] ?? 0,
          excluida: resultado.excluidasBarrera.includes(x.codigo),
          pct: resultado.votosValidos > 0 ? votos / resultado.votosValidos : 0,
          siguiente: analisis[x.codigo]?.siguiente ?? null,
          margen: analisis[x.codigo]?.margen ?? null,
        };
      }),
    [circ, ediciones, resultado, oficial, analisis],
  );

  const setVotos = useCallback(
    (codigo: string, valor: number) => {
      setEdiciones((prev) => {
        const votos = { ...prev.votos };
        const original = circ.candidaturas.find((x) => x.codigo === codigo)?.votos;
        const v = Math.max(0, Math.round(valor));
        if (v === original) delete votos[codigo];
        else votos[codigo] = v;
        return { ...prev, votos };
      });
    },
    [circ],
  );

  const setBlanco = useCallback(
    (v: number) => setEdiciones((p) => ({ ...p, blanco: v === circ.votosBlanco ? undefined : Math.max(0, Math.round(v)) })),
    [circ],
  );
  const setNulos = useCallback(
    (v: number) => setEdiciones((p) => ({ ...p, nulos: v === circ.votosNulos ? undefined : Math.max(0, Math.round(v)) })),
    [circ],
  );

  async function compartir() {
    const url = `${window.location.origin}${window.location.pathname}?${codificarEscenario(circ, ediciones)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success(t("shareCopied"));
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error(t("shareFailed"));
    }
  }

  const opciones = useMemo(
    () => [...ELECCION.circunscripciones].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="py-4">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <Field className="md:max-w-sm">
            <FieldLabel htmlFor="circunscripcion">{t("constituency")}</FieldLabel>
            <Select
              value={codigoINE}
              onValueChange={(v) => {
                setCodigoINE(v);
                setEdiciones(SIN_EDICIONES);
              }}
            >
              <SelectTrigger id="circunscripcion" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-80">
                <SelectGroup>
                  {opciones.map((c) => (
                    <SelectItem key={c.codigoINE} value={c.codigoINE}>
                      {t("constituencyOption", { name: c.nombre, seats: c.escanos })}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex flex-wrap items-center gap-2 md:pb-1">
            <Badge variant="outline">{t("dataBadge")}</Badge>
            <Badge variant={modificado ? "default" : "secondary"} aria-live="polite">
              {modificado ? t("modified") : t("official")}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Button variant="outline" onClick={() => setEdiciones(SIN_EDICIONES)} disabled={!modificado}>
              <RotateCcwIcon data-icon="inline-start" />
              {t("reset")}
            </Button>
            <Button variant="outline" onClick={compartir}>
              {copiado ? <CheckIcon data-icon="inline-start" /> : <Link2Icon data-icon="inline-start" />}
              {t("share")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <EditorVotos
          filas={filas}
          votosBlanco={entrada.votosBlanco}
          votosNulos={entrada.votosNulos}
          votosValidos={resultado.votosValidos}
          validosOficiales={oficial.votosValidos}
          onVotos={setVotos}
          onBlanco={setBlanco}
          onNulos={setNulos}
        />
        <Resultados circ={circ} filas={filas} resultado={resultado} />
      </div>

      <Cocientes circ={circ} filas={filas} resultado={resultado} />
      <EfectoNacional eleccion={ELECCION} circ={circ} resultado={resultado} />

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <p>{t("privacy")}</p>
        <p>{t("sourceNote")}</p>
      </div>
    </div>
  );
}
