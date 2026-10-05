import type { Circunscripcion, Eleccion } from "@/data/elecciones/types";
import { repartir, type EntradaReparto, type ResultadoReparto } from "./dhondt";

/** Cambios del usuario sobre los datos oficiales de una circunscripción. */
export interface Ediciones {
  votos: Record<string, number>;
  blanco?: number;
  nulos?: number;
}

export const SIN_EDICIONES: Ediciones = { votos: {} };

export function hayEdiciones(e: Ediciones): boolean {
  return Object.keys(e.votos).length > 0 || e.blanco !== undefined || e.nulos !== undefined;
}

export function entradaDesde(c: Circunscripcion, e: Ediciones = SIN_EDICIONES): EntradaReparto {
  return {
    escanos: c.escanos,
    esMayoritaria: c.esMayoritaria,
    votosBlanco: e.blanco ?? c.votosBlanco,
    votosNulos: e.nulos ?? c.votosNulos,
    candidaturas: c.candidaturas.map((x) => ({ id: x.codigo, votos: e.votos[x.codigo] ?? x.votos })),
  };
}

/**
 * Votos que necesita una candidatura para alcanzar un porcentaje `pct` de los
 * votos válidos, manteniendo constantes los demás votos válidos `resto`.
 */
export function votosParaPorcentaje(pct: number, resto: number): number {
  const p = Math.min(Math.max(pct, 0), 99.99) / 100;
  return Math.round((p * resto) / (1 - p));
}

export interface EscanosGrupo {
  grupo: string;
  etiqueta: string;
  color: string;
  escanos: number;
  oficiales: number;
}

/**
 * Composición del Congreso: resultado oficial en todas las circunscripciones
 * salvo `circ`, donde se usa `resultado`.
 */
export function agregadoNacional(
  eleccion: Eleccion,
  circ?: { codigoINE: string; resultado: ResultadoReparto },
): EscanosGrupo[] {
  const grupos = new Map<string, EscanosGrupo>();
  for (const c of eleccion.circunscripciones) {
    for (const x of c.candidaturas) {
      const escanos =
        circ && circ.codigoINE === c.codigoINE ? (circ.resultado.escanos[x.codigo] ?? 0) : x.escanosOficiales;
      if (escanos === 0 && x.escanosOficiales === 0) continue;
      const def = eleccion.gruposNacionales[x.cabeceraNacional];
      const g = grupos.get(x.cabeceraNacional) ?? {
        grupo: x.cabeceraNacional,
        etiqueta: def?.etiqueta ?? x.siglas,
        color: def?.color ?? "#8A8A8A",
        escanos: 0,
        oficiales: 0,
      };
      g.escanos += escanos;
      g.oficiales += x.escanosOficiales;
      grupos.set(x.cabeceraNacional, g);
    }
  }
  return [...grupos.values()]
    .filter((g) => g.escanos > 0 || g.oficiales > 0)
    .sort((a, b) => b.escanos - a.escanos || b.oficiales - a.oficiales || a.etiqueta.localeCompare(b.etiqueta));
}

const cacheOficial = new WeakMap<Circunscripcion, ResultadoReparto>();
export function resultadoOficial(c: Circunscripcion): ResultadoReparto {
  let r = cacheOficial.get(c);
  if (!r) {
    r = repartir(entradaDesde(c));
    cacheOficial.set(c, r);
  }
  return r;
}

// ── Escenario en la URL ───────────────────────────────────────────────
// ?c=28&v=5:1500000,2:900000&b=12000&n=3000
// Solo se codifican los valores editados; los códigos van sin ceros a la izquierda.

export function codificarEscenario(c: Circunscripcion, e: Ediciones): string {
  // Solo dígitos, «:» y «,»: no hace falta escapar y el enlace sigue siendo legible.
  const p: string[] = [`c=${c.codigoINE}`];
  const votos = Object.entries(e.votos)
    .map(([codigo, v]) => `${Number.parseInt(codigo, 10)}:${v}`)
    .join(",");
  if (votos) p.push(`v=${votos}`);
  if (e.blanco !== undefined) p.push(`b=${e.blanco}`);
  if (e.nulos !== undefined) p.push(`n=${e.nulos}`);
  return p.join("&");
}

const entero = (s: string | null): number | undefined => {
  if (s === null || !/^\d{1,9}$/.test(s)) return undefined;
  return Number.parseInt(s, 10);
};

export function decodificarEscenario(
  query: string | URLSearchParams,
  eleccion: Eleccion,
): { circ: Circunscripcion; ediciones: Ediciones } | null {
  const p = typeof query === "string" ? new URLSearchParams(query) : query;
  const circ = eleccion.circunscripciones.find((c) => c.codigoINE === p.get("c")?.padStart(2, "0"));
  if (!circ) return null;
  const porCodigo = new Map(circ.candidaturas.map((x) => [Number.parseInt(x.codigo, 10), x.codigo]));
  const votos: Record<string, number> = {};
  for (const par of (p.get("v") ?? "").split(",")) {
    const [k, v] = par.split(":");
    const codigo = porCodigo.get(Number.parseInt(k, 10));
    const n = entero(v ?? null);
    if (codigo && n !== undefined) votos[codigo] = n;
  }
  return { circ, ediciones: { votos, blanco: entero(p.get("b")), nulos: entero(p.get("n")) } };
}
