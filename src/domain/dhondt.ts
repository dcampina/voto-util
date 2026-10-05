/**
 * Reparto de escaños del Congreso (arts. 162 y 163 LOREG).
 *
 * - Barrera: 3 % de los votos válidos emitidos en la circunscripción
 *   (votos a candidaturas + votos en blanco). Los nulos no cuentan.
 * - Reparto: cocientes D'Hondt (votos ÷ 1, 2, … , escaños).
 * - Coincidencia de cocientes: escaño para la candidatura con más votos
 *   totales. Si también empatan en votos, la ley prevé sorteo (el primero) y
 *   alternancia (los siguientes). El motor no sortea: asigna de forma
 *   determinista y marca el caso con `requiereSorteo` para revisión humana.
 * - Ceuta y Melilla: un escaño para la candidatura más votada.
 *
 * Los cocientes se comparan por producto cruzado de enteros (a·d₂ vs b·d₁),
 * de modo que no hay redondeo ni error de coma flotante.
 */

export interface CandidaturaEntrada {
  id: string;
  votos: number;
}

export interface EntradaReparto {
  escanos: number;
  candidaturas: CandidaturaEntrada[];
  votosBlanco: number;
  votosNulos: number;
  /** Ceuta y Melilla: un escaño por mayoría simple. */
  esMayoritaria?: boolean;
}

export interface Cociente {
  candidaturaId: string;
  divisor: number;
  /** Solo para mostrar; las comparaciones usan votos y divisor. */
  valor: number;
  /** Orden del escaño obtenido (1…n) o null si no obtiene escaño. */
  escano: number | null;
}

export interface EmpateSorteo {
  /** Escaño en disputa (1…n). */
  escano: number;
  candidaturas: string[];
}

export interface ResultadoReparto {
  escanos: Record<string, number>;
  /** Cocientes ordenados de mayor a menor (solo candidaturas que superan la barrera). */
  cocientes: Cociente[];
  excluidasBarrera: string[];
  votosValidos: number;
  /** Votos mínimos para superar la barrera (≥ 3 % de los válidos). */
  votosBarrera: number;
  /** Último cociente que obtiene escaño. */
  frontera: Cociente | null;
  /** Primer cociente que se queda sin escaño. */
  primerExcluido: Cociente | null;
  requiereSorteo: EmpateSorteo | null;
  sinVotos: boolean;
  esMayoritaria: boolean;
}

export const BARRERA = 0.03;

function validar(entrada: EntradaReparto) {
  const enteroNoNegativo = (n: number) => Number.isSafeInteger(n) && n >= 0;
  if (!Number.isSafeInteger(entrada.escanos) || entrada.escanos < 1) {
    throw new RangeError("escanos debe ser un entero positivo");
  }
  if (!enteroNoNegativo(entrada.votosBlanco) || !enteroNoNegativo(entrada.votosNulos)) {
    throw new RangeError("Los votos en blanco y nulos deben ser enteros no negativos");
  }
  const ids = new Set<string>();
  for (const c of entrada.candidaturas) {
    if (!enteroNoNegativo(c.votos)) throw new RangeError(`Votos inválidos para ${c.id}`);
    if (ids.has(c.id)) throw new Error(`Candidatura duplicada: ${c.id}`);
    ids.add(c.id);
  }
}

/** Compara a/da con b/db sin dividir. >0 si el primero es mayor. */
function compararCocientes(a: number, da: number, b: number, db: number): number {
  return a * db - b * da;
}

/** Votos mínimos para alcanzar el 3 %: votos·100 ≥ válidos·3. */
export function votosParaBarrera(votosValidos: number): number {
  return Math.ceil((votosValidos * 3) / 100);
}

export function superaBarrera(votos: number, votosValidos: number): boolean {
  return votos > 0 && votos * 100 >= votosValidos * 3;
}

export function repartir(entrada: EntradaReparto): ResultadoReparto {
  validar(entrada);
  const { escanos: totalEscanos, candidaturas, votosBlanco } = entrada;
  const esMayoritaria = Boolean(entrada.esMayoritaria);
  const votosValidos = candidaturas.reduce((s, c) => s + c.votos, 0) + votosBlanco;
  const votosBarrera = votosParaBarrera(votosValidos);

  const escanos: Record<string, number> = {};
  for (const c of candidaturas) escanos[c.id] = 0;
  const votosPorId = new Map(candidaturas.map((c) => [c.id, c.votos]));

  const base = {
    escanos,
    votosValidos,
    votosBarrera,
    esMayoritaria,
  };

  if (candidaturas.every((c) => c.votos === 0)) {
    return {
      ...base,
      cocientes: [],
      excluidasBarrera: [],
      frontera: null,
      primerExcluido: null,
      requiereSorteo: null,
      sinVotos: true,
    };
  }

  if (esMayoritaria) {
    const ordenadas = [...candidaturas].sort((a, b) => b.votos - a.votos);
    const max = ordenadas[0].votos;
    const empatadas = ordenadas.filter((c) => c.votos === max).map((c) => c.id);
    escanos[ordenadas[0].id] = 1;
    const cocientes: Cociente[] = ordenadas
      .filter((c) => c.votos > 0)
      .map((c, i) => ({ candidaturaId: c.id, divisor: 1, valor: c.votos, escano: i === 0 ? 1 : null }));
    return {
      ...base,
      cocientes,
      excluidasBarrera: [],
      frontera: cocientes[0],
      primerExcluido: cocientes[1] ?? null,
      requiereSorteo: empatadas.length > 1 ? { escano: 1, candidaturas: empatadas } : null,
      sinVotos: false,
    };
  }

  const superan = candidaturas.filter((c) => superaBarrera(c.votos, votosValidos));
  const excluidasBarrera = candidaturas.filter((c) => !superaBarrera(c.votos, votosValidos)).map((c) => c.id);

  const cocientes: Cociente[] = [];
  for (const c of superan) {
    for (let d = 1; d <= totalEscanos; d++) {
      cocientes.push({ candidaturaId: c.id, divisor: d, valor: c.votos / d, escano: null });
    }
  }

  const votos = (q: Cociente) => votosPorId.get(q.candidaturaId)!;
  const empataCompletamente = (a: Cociente, b: Cociente) =>
    compararCocientes(votos(a), a.divisor, votos(b), b.divisor) === 0 && votos(a) === votos(b);

  cocientes.sort((a, b) => {
    const cmp = compararCocientes(votos(b), b.divisor, votos(a), a.divisor);
    if (cmp !== 0) return cmp;
    const porVotos = votos(b) - votos(a);
    if (porVotos !== 0) return porVotos;
    return a.candidaturaId.localeCompare(b.candidaturaId);
  });

  const asignables = Math.min(totalEscanos, cocientes.length);
  for (let i = 0; i < asignables; i++) {
    cocientes[i].escano = i + 1;
    escanos[cocientes[i].candidaturaId]++;
  }

  const frontera = asignables > 0 ? cocientes[asignables - 1] : null;
  const primerExcluido = cocientes[asignables] ?? null;

  let requiereSorteo: EmpateSorteo | null = null;
  if (frontera && primerExcluido && empataCompletamente(frontera, primerExcluido)) {
    const implicadas = cocientes.filter((q) => empataCompletamente(q, frontera)).map((q) => q.candidaturaId);
    const primerEscanoEmpatado = cocientes.findIndex((q) => empataCompletamente(q, frontera)) + 1;
    requiereSorteo = { escano: primerEscanoEmpatado, candidaturas: [...new Set(implicadas)] };
  }

  return {
    ...base,
    cocientes,
    excluidasBarrera,
    frontera,
    primerExcluido,
    requiereSorteo,
    sinVotos: false,
  };
}

/**
 * Votos adicionales mínimos que necesitaría una candidatura para obtener un
 * escaño más, manteniendo constantes el resto de votos. null si no es
 * alcanzable dentro de `limite`.
 */
export function votosParaSiguienteEscano(
  entrada: EntradaReparto,
  id: string,
  limite = 50_000_000,
): number | null {
  const actual = repartir(entrada).escanos[id] ?? 0;
  if (actual >= entrada.escanos) return null;
  const con = (extra: number) =>
    repartir({
      ...entrada,
      candidaturas: entrada.candidaturas.map((c) => (c.id === id ? { ...c, votos: c.votos + extra } : c)),
    });
  const gana = (extra: number) => {
    const r = con(extra);
    return r.escanos[id] > actual && !(r.requiereSorteo?.candidaturas.includes(id) ?? false);
  };
  if (!gana(limite)) return null;
  let lo = 0;
  let hi = limite;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (gana(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Votos que podría perder una candidatura sin perder ninguno de sus escaños,
 * manteniendo constantes el resto. null si no tiene escaños.
 */
export function margenUltimoEscano(entrada: EntradaReparto, id: string): number | null {
  const actual = repartir(entrada).escanos[id] ?? 0;
  if (actual === 0) return null;
  const votos = entrada.candidaturas.find((c) => c.id === id)!.votos;
  const mantiene = (perdidos: number) => {
    const r = repartir({
      ...entrada,
      candidaturas: entrada.candidaturas.map((c) => (c.id === id ? { ...c, votos: c.votos - perdidos } : c)),
    });
    return r.escanos[id] >= actual && !(r.requiereSorteo?.candidaturas.includes(id) ?? false);
  };
  let lo = 0;
  let hi = votos;
  if (mantiene(hi)) return hi;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (mantiene(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}
