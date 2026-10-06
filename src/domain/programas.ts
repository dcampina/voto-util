/**
 * Modelo del comparador de programas y del índice de concreción.
 *
 * El índice mide solo el nivel de detalle explícito del texto: no mide
 * calidad, viabilidad, impacto, coherencia ni preferencia política.
 */

export const CRITERIOS = ["diagnostico", "mecanismo", "financiacion", "calendario", "indicador"] as const;
export type Criterio = (typeof CRITERIOS)[number];
export type Criterios = Record<Criterio, boolean>;

export const NIVELES = ["generica", "basica", "desarrollada", "detallada"] as const;
export type NivelConcrecion = (typeof NIVELES)[number];

export interface Concrecion {
  criterios: Criterios;
  total: number;
  /** Criterios que puntúan. Es 4 cuando la medida no requiere financiación. */
  maximo: number;
  nivel: NivelConcrecion;
}

export function nivelDesdeTotal(total: number): NivelConcrecion {
  if (!Number.isInteger(total) || total < 0 || total > CRITERIOS.length) {
    throw new RangeError(`Puntuación fuera de rango: ${total}`);
  }
  if (total <= 1) return "generica";
  if (total === 2) return "basica";
  if (total === 3) return "desarrollada";
  return "detallada";
}

export function calcularConcrecion(criterios: Criterios, requiereFinanciacion = true): Concrecion {
  const aplicables = requiereFinanciacion ? CRITERIOS : CRITERIOS.filter((c) => c !== "financiacion");
  const total = aplicables.filter((c) => criterios[c]).length;
  return { criterios, total, maximo: aplicables.length, nivel: nivelDesdeTotal(total) };
}

/** Lleva una puntuación con máximo 4 o 5 a la escala 0–5 de las medias. */
export function puntuacionSobreCinco(concrecion: Pick<Concrecion, "total" | "maximo">): number {
  return (concrecion.total / concrecion.maximo) * CRITERIOS.length;
}

/** Nivel para una media (0–5), usando los mismos umbrales redondeando a la baja. */
export function nivelDesdeMedia(media: number): NivelConcrecion {
  return nivelDesdeTotal(Math.min(CRITERIOS.length, Math.max(0, Math.floor(media))));
}

// ── Datos ──────────────────────────────────────────────────────────────

export type Locale = "es" | "ca" | "eu" | "gl";

export type EstadoRevision = "pendiente-fuente" | "borrador" | "revisada";

export interface Cita {
  /** Texto literal, en el idioma original del programa. */
  texto: string;
  /** Código de idioma del documento fuente (es, ca, eu, gl…). */
  idioma: string;
  paginas: string;
}

export interface Medida {
  id: string;
  eleccionId: string;
  /** Resumen editorial breve, separado de la cita. */
  resumen: Partial<Record<Locale, string>> & { es: string };
  /** null mientras no se haya transcrito la cita del programa oficial. */
  cita: Cita | null;
  criterios: Criterios;
  /**
   * false cuando la medida no comporta gasto público, ingreso ni fuente de financiación.
   * En ese caso el criterio de financiación no entra en la puntuación. Si se omite, sí la requiere.
   */
  requiereFinanciacion?: boolean;
  revision: {
    estado: EstadoRevision;
    revisor: string | null;
    fecha: string | null;
  };
  /** true en los datos de ejemplo; nunca en contenido publicado. */
  ilustrativa?: boolean;
}

export interface Posicion {
  partidoId: string;
  /** true si el programa revisado no menciona el subtema. */
  sinMencion: boolean;
  medidas: Medida[];
}

export interface Subtema {
  id: string;
  posiciones: Posicion[];
}

export interface Categoria {
  id: string;
  icono: string;
  subtemas: Subtema[];
}

export type OrigenPrograma = "oficial" | "tercera";

export interface Programa {
  url: string;
  fechaPublicacion: string | null;
  fechaConsulta: string | null;
  idioma: string;
  /** oficial: publicado por el partido. tercera: otra web, porque no está en la del partido. */
  origen: OrigenPrograma;
  /** Quién publica el documento cuando el origen no es la web del partido. */
  editor: string | null;
}

/** Identidad de una candidatura dentro de una elección concreta. */
export interface PartidoPrograma {
  id: string;
  eleccionId: string;
  siglas: string;
  nombre: string;
  ambito: "estatal" | "autonomico";
  color: string;
  programa: Programa | null;
}

export interface DatosComparador {
  eleccionId: string;
  esEjemplo: boolean;
  fechaActualizacion: string;
  partidos: PartidoPrograma[];
  categorias: Categoria[];
}

export type EstadoCelda =
  | { tipo: "sin-datos" }
  | { tipo: "sin-mencion" }
  | { tipo: "medidas"; medidas: Medida[] };

export function estadoCelda(subtema: Subtema, partidoId: string): EstadoCelda {
  const pos = subtema.posiciones.find((p) => p.partidoId === partidoId);
  if (!pos) return { tipo: "sin-datos" };
  if (pos.sinMencion) return { tipo: "sin-mencion" };
  if (pos.medidas.length === 0) return { tipo: "sin-datos" };
  return { tipo: "medidas", medidas: pos.medidas };
}

/** Media del índice (0–5) de las medidas de un partido en una categoría. */
export function mediaCategoria(categoria: Categoria, partidoId: string): number | null {
  const totales = categoria.subtemas.flatMap((s) => {
    const e = estadoCelda(s, partidoId);
    return e.tipo === "medidas"
      ? e.medidas.map((m) => puntuacionSobreCinco(calcularConcrecion(m.criterios, m.requiereFinanciacion)))
      : [];
  });
  if (totales.length === 0) return null;
  return totales.reduce((a, b) => a + b, 0) / totales.length;
}

export function resumenEn(medida: Medida, locale: Locale): string {
  return medida.resumen[locale] ?? medida.resumen.es;
}
