import circunscripciones2023 from "./congreso-2023-07/circunscripciones.json";
import grupos2023 from "./congreso-2023-07/grupos.json";
import manifest2023 from "./congreso-2023-07/manifest.json";
import { iconoCabecera } from "@/data/partidos";
import type { Circunscripcion, Eleccion, GrupoNacional } from "./types";

export type * from "./types";

const { _nota, ...gruposNacionales2023 } = grupos2023;
void _nota;

export const ELECCIONES: Record<string, Eleccion> = {
  "congreso-2023-07": {
    id: "congreso-2023-07",
    fecha: manifest2023.eleccion.fecha,
    circunscripciones: circunscripciones2023.circunscripciones as Circunscripcion[],
    gruposNacionales: gruposNacionales2023 as Record<string, GrupoNacional>,
    manifest: manifest2023,
  },
};

export const ELECCION_ACTUAL = ELECCIONES["congreso-2023-07"];

const GRIS = "#8A8A8A";

export function grupoDe(eleccion: Eleccion, cabeceraNacional: string, siglas: string): GrupoNacional {
  const grupo = eleccion.gruposNacionales[cabeceraNacional] ?? { etiqueta: siglas, color: GRIS };
  const icono = iconoCabecera(eleccion.id, cabeceraNacional);
  return icono ? { ...grupo, icono } : grupo;
}
