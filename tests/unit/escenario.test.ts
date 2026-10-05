import { describe, expect, it } from "vitest";
import { ELECCION_ACTUAL } from "@/data/elecciones";
import { repartir } from "@/domain/dhondt";
import {
  agregadoNacional,
  codificarEscenario,
  decodificarEscenario,
  entradaDesde,
  hayEdiciones,
  votosParaPorcentaje,
} from "@/domain/escenario";

const madrid = ELECCION_ACTUAL.circunscripciones.find((c) => c.codigoINE === "28")!;

describe("escenarios", () => {
  it("aplica las ediciones sobre los datos oficiales", () => {
    const pp = madrid.candidaturas[0];
    const e = entradaDesde(madrid, { votos: { [pp.codigo]: 1 }, blanco: 0 });
    expect(e.candidaturas[0].votos).toBe(1);
    expect(e.votosBlanco).toBe(0);
    expect(e.votosNulos).toBe(madrid.votosNulos);
  });

  it("codifica y decodifica el escenario en la URL", () => {
    const pp = madrid.candidaturas[0];
    const ed = { votos: { [pp.codigo]: 1_000_000 }, blanco: 5, nulos: 7 };
    const q = codificarEscenario(madrid, ed);
    expect(q).toContain("c=28");
    const back = decodificarEscenario(q, ELECCION_ACTUAL)!;
    expect(back.circ.codigoINE).toBe("28");
    expect(back.ediciones).toEqual(ed);
    expect(hayEdiciones(back.ediciones)).toBe(true);
  });

  it("ignora valores inválidos en la URL", () => {
    const back = decodificarEscenario("c=28&v=5:-3,999:10,5:abc&b=x", ELECCION_ACTUAL)!;
    expect(back.ediciones).toEqual({ votos: {}, blanco: undefined, nulos: undefined });
    expect(decodificarEscenario("c=99", ELECCION_ACTUAL)).toBeNull();
  });

  it("calcula los votos para un porcentaje dado", () => {
    // 25 % con 300 votos válidos restantes → 100 votos.
    expect(votosParaPorcentaje(25, 300)).toBe(100);
    expect(votosParaPorcentaje(0, 300)).toBe(0);
  });

  it("el agregado nacional oficial suma 350 y refleja un cambio local", () => {
    const oficial = agregadoNacional(ELECCION_ACTUAL);
    expect(oficial.reduce((s, g) => s + g.escanos, 0)).toBe(350);
    const pp = madrid.candidaturas[0];
    const r = repartir(entradaDesde(madrid, { votos: { [pp.codigo]: 0 } }));
    const conCambio = agregadoNacional(ELECCION_ACTUAL, { codigoINE: "28", resultado: r });
    expect(conCambio.reduce((s, g) => s + g.escanos, 0)).toBe(350);
    expect(conCambio.find((g) => g.etiqueta === "PP")!.escanos).toBe(137 - 16);
  });
});
