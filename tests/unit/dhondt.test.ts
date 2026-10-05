import { describe, expect, it } from "vitest";
import {
  margenUltimoEscano,
  repartir,
  superaBarrera,
  votosParaBarrera,
  votosParaSiguienteEscano,
  type EntradaReparto,
} from "@/domain/dhondt";

const suma = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

describe("repartir — D'Hondt básico", () => {
  it("reparte según los cocientes mayores", () => {
    // Ejemplo clásico: 7 escaños.
    const r = repartir({
      escanos: 7,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [
        { id: "A", votos: 100_000 },
        { id: "B", votos: 80_000 },
        { id: "C", votos: 30_000 },
        { id: "D", votos: 20_000 },
      ],
    });
    expect(r.escanos).toEqual({ A: 3, B: 3, C: 1, D: 0 });
    expect(suma(r.escanos)).toBe(7);
    expect(r.frontera).toMatchObject({ escano: 7 });
    expect(r.primerExcluido).not.toBeNull();
  });

  it("asigna siempre el número total de escaños cuando hay votos", () => {
    for (const escanos of [2, 5, 13, 37]) {
      const r = repartir({
        escanos,
        votosBlanco: 1000,
        votosNulos: 500,
        candidaturas: [
          { id: "A", votos: 51_234 },
          { id: "B", votos: 40_002 },
          { id: "C", votos: 9_999 },
        ],
      });
      expect(suma(r.escanos)).toBe(escanos);
    }
  });

  it("los cocientes de una candidatura llegan hasta el número de escaños", () => {
    const r = repartir({
      escanos: 4,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 100 }, { id: "B", votos: 50 }],
    });
    expect(r.cocientes.filter((q) => q.candidaturaId === "A").map((q) => q.divisor)).toEqual([1, 2, 3, 4]);
  });
});

describe("barrera del 3 %", () => {
  it("compara con los votos válidos (candidaturas + blanco), sin redondear", () => {
    expect(votosParaBarrera(1000)).toBe(30);
    expect(superaBarrera(30, 1000)).toBe(true);
    expect(superaBarrera(29, 1000)).toBe(false);
    expect(votosParaBarrera(1001)).toBe(31); // 30,03 → hace falta 31
    expect(superaBarrera(30, 1001)).toBe(false);
  });

  it("excluye candidaturas por debajo del 3 % aunque tendrían escaño por cociente", () => {
    const entrada: EntradaReparto = {
      escanos: 37,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [
        { id: "A", votos: 600_000 },
        { id: "B", votos: 380_000 },
        { id: "C", votos: 29_999 }, // 2,97 %
      ],
    };
    const r = repartir(entrada);
    expect(r.excluidasBarrera).toEqual(["C"]);
    expect(r.escanos.C).toBe(0);
    expect(r.cocientes.some((q) => q.candidaturaId === "C")).toBe(false);
  });

  it("los votos en blanco elevan la barrera", () => {
    const base: EntradaReparto = {
      escanos: 10,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [
        { id: "A", votos: 600 },
        { id: "B", votos: 370 },
        { id: "C", votos: 30 }, // exactamente 3 % sin blancos
      ],
    };
    expect(repartir(base).excluidasBarrera).toEqual([]);
    expect(repartir({ ...base, votosBlanco: 10 }).excluidasBarrera).toEqual(["C"]);
  });

  it("los votos nulos no cuentan para la barrera ni para el reparto", () => {
    const base: EntradaReparto = {
      escanos: 10,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [
        { id: "A", votos: 600 },
        { id: "B", votos: 370 },
        { id: "C", votos: 30 },
      ],
    };
    const conNulos = repartir({ ...base, votosNulos: 1_000_000 });
    expect(conNulos.excluidasBarrera).toEqual([]);
    expect(conNulos.escanos).toEqual(repartir(base).escanos);
    expect(conNulos.votosValidos).toBe(1000);
  });
});

describe("casos límite", () => {
  it("cero votos: no asigna escaños y lo indica", () => {
    const r = repartir({
      escanos: 5,
      votosBlanco: 0,
      votosNulos: 10,
      candidaturas: [{ id: "A", votos: 0 }, { id: "B", votos: 0 }],
    });
    expect(r.sinVotos).toBe(true);
    expect(suma(r.escanos)).toBe(0);
  });

  it("solo votos en blanco: ninguna candidatura supera la barrera", () => {
    const r = repartir({
      escanos: 3,
      votosBlanco: 1000,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 10 }, { id: "B", votos: 0 }],
    });
    expect(r.excluidasBarrera).toEqual(["A", "B"]);
    expect(suma(r.escanos)).toBe(0);
  });

  it("rechaza votos negativos o no enteros", () => {
    const mal = (votos: number) =>
      repartir({ escanos: 2, votosBlanco: 0, votosNulos: 0, candidaturas: [{ id: "A", votos }] });
    expect(() => mal(-1)).toThrow(RangeError);
    expect(() => mal(1.5)).toThrow(RangeError);
  });

  it("rechaza identificadores duplicados", () => {
    expect(() =>
      repartir({ escanos: 2, votosBlanco: 0, votosNulos: 0, candidaturas: [{ id: "A", votos: 1 }, { id: "A", votos: 2 }] }),
    ).toThrow();
  });
});

describe("empates (art. 163.1 LOREG)", () => {
  it("cocientes iguales: gana la candidatura con más votos totales", () => {
    // A/2 = 50 = B/1 → el escaño en disputa es para A (más votos totales).
    const r = repartir({
      escanos: 2,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 100 }, { id: "B", votos: 50 }],
    });
    expect(r.escanos).toEqual({ A: 2, B: 0 });
    expect(r.requiereSorteo).toBeNull();
  });

  it("igualdad de cociente y de votos en la frontera: señala sorteo", () => {
    const r = repartir({
      escanos: 3,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [
        { id: "A", votos: 200 },
        { id: "B", votos: 100 },
        { id: "C", votos: 100 },
      ],
    });
    // A/1=200, A/2=100, B/1=100, C/1=100 → tres cocientes de 100 para 2 escaños,
    // pero A tiene más votos totales, así que el empate real es B vs C.
    expect(r.escanos.A).toBe(2);
    expect(r.requiereSorteo).toEqual({ escano: 3, candidaturas: ["B", "C"] });
  });

  it("empate total dentro de los escaños asignados no requiere sorteo", () => {
    const r = repartir({
      escanos: 2,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 100 }, { id: "B", votos: 100 }, { id: "C", votos: 10 }],
    });
    expect(r.escanos).toEqual({ A: 1, B: 1, C: 0 });
    expect(r.requiereSorteo).toBeNull();
  });

  it("compara cocientes con exactitud (sin coma flotante)", () => {
    // 3/3 y 1/1 son iguales; un cálculo en coma flotante podría no verlo en otros casos.
    const r = repartir({
      escanos: 3,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 300_000_003 }, { id: "B", votos: 100_000_001 }],
    });
    expect(r.escanos).toEqual({ A: 3, B: 0 });
  });
});

describe("Ceuta y Melilla (mayoría simple)", () => {
  it("asigna el único escaño a la más votada, sin barrera", () => {
    const r = repartir({
      escanos: 1,
      esMayoritaria: true,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 12_918 }, { id: "B", votos: 11_332 }, { id: "C", votos: 7_752 }],
    });
    expect(r.escanos).toEqual({ A: 1, B: 0, C: 0 });
    expect(r.excluidasBarrera).toEqual([]);
    expect(r.esMayoritaria).toBe(true);
  });

  it("señala empate en primera posición", () => {
    const r = repartir({
      escanos: 1,
      esMayoritaria: true,
      votosBlanco: 0,
      votosNulos: 0,
      candidaturas: [{ id: "A", votos: 500 }, { id: "B", votos: 500 }],
    });
    expect(r.requiereSorteo?.candidaturas.sort()).toEqual(["A", "B"]);
  });
});

describe("análisis de escenarios", () => {
  const entrada: EntradaReparto = {
    escanos: 7,
    votosBlanco: 0,
    votosNulos: 0,
    candidaturas: [
      { id: "A", votos: 100_000 },
      { id: "B", votos: 80_000 },
      { id: "C", votos: 30_000 },
      { id: "D", votos: 20_000 },
    ],
  };

  it("votos para el siguiente escaño: el mínimo exacto", () => {
    const extra = votosParaSiguienteEscano(entrada, "D")!;
    expect(extra).toBeGreaterThan(0);
    const mas = (n: number) =>
      repartir({ ...entrada, candidaturas: entrada.candidaturas.map((c) => (c.id === "D" ? { ...c, votos: c.votos + n } : c)) });
    expect(mas(extra).escanos.D).toBe(1);
    expect(mas(extra - 1).escanos.D).toBe(0);
  });

  it("margen del último escaño: el máximo exacto", () => {
    const margen = margenUltimoEscano(entrada, "C")!;
    const menos = (n: number) =>
      repartir({ ...entrada, candidaturas: entrada.candidaturas.map((c) => (c.id === "C" ? { ...c, votos: c.votos - n } : c)) });
    expect(menos(margen).escanos.C).toBe(1);
    expect(menos(margen + 1).escanos.C).toBe(0);
    expect(margenUltimoEscano(entrada, "D")).toBeNull();
  });
});
