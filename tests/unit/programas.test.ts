import { describe, expect, it } from "vitest";
import { PROGRAMAS } from "@/data/programas";
import {
  CRITERIOS,
  calcularConcrecion,
  estadoCelda,
  mediaCategoria,
  nivelDesdeMedia,
  nivelDesdeTotal,
  type Criterios,
} from "@/domain/programas";
import es from "@/messages/es.json";

const criterios = (n: number): Criterios =>
  Object.fromEntries(CRITERIOS.map((c, i) => [c, i < n])) as Criterios;

describe("índice de concreción", () => {
  it.each([
    [0, "generica"],
    [1, "generica"],
    [2, "basica"],
    [3, "desarrollada"],
    [4, "detallada"],
    [5, "detallada"],
  ] as const)("%i criterios → %s", (n, nivel) => {
    const r = calcularConcrecion(criterios(n));
    expect(r.total).toBe(n);
    expect(r.nivel).toBe(nivel);
  });

  it("rechaza puntuaciones fuera de rango", () => {
    expect(() => nivelDesdeTotal(6)).toThrow(RangeError);
    expect(() => nivelDesdeTotal(-1)).toThrow(RangeError);
  });

  it("las medias usan los mismos umbrales", () => {
    expect(nivelDesdeMedia(1.9)).toBe("generica");
    expect(nivelDesdeMedia(2)).toBe("basica");
    expect(nivelDesdeMedia(3.5)).toBe("desarrollada");
    expect(nivelDesdeMedia(5)).toBe("detallada");
  });
});

describe("estado de cada celda", () => {
  const sub = {
    id: "x",
    posiciones: [
      { partidoId: "a", sinMencion: true, medidas: [] },
      { partidoId: "b", sinMencion: false, medidas: [] },
    ],
  };
  it("distingue 'no lo menciona' de 'sin datos'", () => {
    expect(estadoCelda(sub, "a").tipo).toBe("sin-mencion");
    expect(estadoCelda(sub, "b").tipo).toBe("sin-datos");
    expect(estadoCelda(sub, "c").tipo).toBe("sin-datos");
  });
});

describe("datos de programas", () => {
  const partidos = new Set(PROGRAMAS.partidos.map((p) => p.id));
  const medidas = PROGRAMAS.categorias.flatMap((c) =>
    c.subtemas.flatMap((s) => s.posiciones.flatMap((p) => p.medidas.map((m) => ({ m, partidoId: p.partidoId })))),
  );

  it("identificadores de partido únicos y versionados por elección", () => {
    expect(partidos.size).toBe(PROGRAMAS.partidos.length);
    for (const p of PROGRAMAS.partidos) expect(p.eleccionId).toBe(PROGRAMAS.eleccionId);
  });

  it("cada posición apunta a un partido existente", () => {
    for (const { partidoId } of medidas) expect(partidos.has(partidoId)).toBe(true);
  });

  it("toda medida pertenece a la elección del conjunto de datos", () => {
    for (const { m } of medidas) expect(m.eleccionId).toBe(PROGRAMAS.eleccionId);
  });

  it("las medidas revisadas tienen cita, página, URL del programa y revisor", () => {
    for (const { m, partidoId } of medidas.filter(({ m }) => m.revision.estado === "revisada")) {
      const partido = PROGRAMAS.partidos.find((p) => p.id === partidoId)!;
      expect(m.cita?.texto).toBeTruthy();
      expect(m.cita?.paginas).toBeTruthy();
      expect(partido.programa?.url).toMatch(/^https?:\/\//);
      expect(m.revision.revisor).toBeTruthy();
    }
  });

  it("ninguna cita conserva marcadores de pendiente", () => {
    for (const { m } of medidas) expect(m.cita?.texto ?? "").not.toMatch(/\[\s*cita pendiente/i);
  });

  it("las medidas ilustrativas solo existen en conjuntos marcados como ejemplo", () => {
    if (!PROGRAMAS.esEjemplo) for (const { m } of medidas) expect(m.ilustrativa).toBeFalsy();
  });

  it("cada categoría y subtema tiene traducción", () => {
    for (const c of PROGRAMAS.categorias) {
      expect(es.categories).toHaveProperty(c.id);
      for (const s of c.subtemas) expect(es.subtopics).toHaveProperty(s.id);
    }
  });

  it("calcula medias por categoría ignorando celdas sin datos", () => {
    const vivienda = PROGRAMAS.categorias.find((c) => c.id === "vivienda")!;
    expect(mediaCategoria(vivienda, "sumar")).toBe(5);
    expect(mediaCategoria(vivienda, "bng")).toBeNull();
  });
});
