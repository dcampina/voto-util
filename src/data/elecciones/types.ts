export interface CandidaturaCircunscripcion {
  /** Código de la candidatura en Infoelectoral (estable dentro de una elección). */
  codigo: string;
  siglas: string;
  denominacion: string;
  /** Código de la candidatura cabecera de acumulación nacional. */
  cabeceraNacional: string;
  votos: number;
  escanosOficiales: number;
}

export interface Circunscripcion {
  codigoINE: string;
  slug: string;
  nombre: string;
  escanos: number;
  esMayoritaria: boolean;
  censoEscrutinio: number;
  votosCandidaturas: number;
  votosBlanco: number;
  votosNulos: number;
  datosOficiales: boolean;
  candidaturas: CandidaturaCircunscripcion[];
}

export interface GrupoNacional {
  /** Etiqueta corta para gráficos agregados. */
  etiqueta: string;
  /** Color orientativo; la interfaz siempre lo acompaña de siglas. */
  color: string;
}

export interface Manifest {
  eleccion: { id: string; fecha: string; nombre: string };
  fuente: {
    organismo: string;
    url: string;
    formatoOriginal: string;
    sha256: string;
    fechaDescarga: string;
    condicionesReutilizacion: string;
    ficherosUsados: string[];
  };
  tipoDato: string;
  notasTransformacion: string[];
}

export interface Eleccion {
  id: string;
  fecha: string;
  circunscripciones: Circunscripcion[];
  gruposNacionales: Record<string, GrupoNacional>;
  manifest: Manifest;
}
