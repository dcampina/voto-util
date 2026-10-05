export interface Fila {
  codigo: string;
  siglas: string;
  denominacion: string;
  color: string;
  votos: number;
  votosOficiales: number;
  escanos: number;
  escanosOficiales: number;
  excluida: boolean;
  /** Fracción de votos válidos (0–1). */
  pct: number;
  /** Votos adicionales para un escaño más (resto constante). */
  siguiente: number | null;
  /** Votos que puede perder sin perder escaños (resto constante). */
  margen: number | null;
}
