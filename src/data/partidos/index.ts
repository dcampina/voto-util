import iconosJson from "./iconos.json";
import websJson from "./webs.json";

export interface IconoPartido {
  /** Ruta pública del fichero (servido desde este mismo sitio). */
  archivo: string;
  /** URL de la que se descargó. */
  origen: string;
  tipo: string;
  bytes: number;
  sha256: string;
  nota?: string;
}

export interface WebPartido {
  nombre: string;
  web: string;
  icono?: string;
  notaIcono?: string;
  /** Código de cabecera de acumulación nacional por elección. */
  cabeceras: Record<string, string>;
}

const { _nota, ...webs } = websJson;
void _nota;

export const WEBS_PARTIDOS = webs as Record<string, WebPartido>;
export const ICONOS = iconosJson.iconos as Record<string, IconoPartido>;
export const ICONOS_SIN_FICHERO = iconosJson.sinIcono as Record<string, string>;
export const FECHA_ICONOS = iconosJson.fechaDescarga;

const porCabecera = new Map<string, string>();
for (const [id, p] of Object.entries(WEBS_PARTIDOS)) {
  for (const [eleccionId, codigo] of Object.entries(p.cabeceras)) porCabecera.set(`${eleccionId}/${codigo}`, id);
}

export function iconoPartido(id: string): string | undefined {
  return ICONOS[id]?.archivo;
}

export function iconoCabecera(eleccionId: string, cabeceraNacional: string): string | undefined {
  const id = porCabecera.get(`${eleccionId}/${cabeceraNacional}`);
  return id ? iconoPartido(id) : undefined;
}
