import { describe, expect, it } from "vitest";
import { ELECCION_ACTUAL } from "@/data/elecciones";
import { repartir } from "@/domain/dhondt";

const circs = ELECCION_ACTUAL.circunscripciones;

describe("datos Congreso 2023 (Infoelectoral)", () => {
  it("contiene las 52 circunscripciones y 350 escaños", () => {
    expect(circs).toHaveLength(52);
    expect(circs.reduce((s, c) => s + c.escanos, 0)).toBe(350);
  });

  it("Ceuta y Melilla son las únicas circunscripciones mayoritarias de 1 escaño", () => {
    const mayoritarias = circs.filter((c) => c.esMayoritaria).map((c) => c.nombre).sort();
    expect(mayoritarias).toEqual(["Ceuta", "Melilla"]);
    expect(circs.filter((c) => c.escanos === 1).every((c) => c.esMayoritaria)).toBe(true);
  });

  it.each(circs.map((c) => [c.nombre, c] as const))("%s: esquema y totales coherentes", (_, c) => {
    expect(c.datosOficiales).toBe(true);
    expect(c.votosBlanco).toBeGreaterThanOrEqual(0);
    expect(c.votosNulos).toBeGreaterThanOrEqual(0);
    const codigos = new Set(c.candidaturas.map((x) => x.codigo));
    expect(codigos.size).toBe(c.candidaturas.length);
    for (const x of c.candidaturas) {
      expect(Number.isSafeInteger(x.votos) && x.votos >= 0).toBe(true);
      expect(x.siglas.length).toBeGreaterThan(0);
    }
    expect(c.candidaturas.reduce((s, x) => s + x.votos, 0)).toBe(c.votosCandidaturas);
    expect(c.candidaturas.reduce((s, x) => s + x.escanosOficiales, 0)).toBe(c.escanos);
  });

  it.each(circs.map((c) => [c.nombre, c] as const))("%s: el motor reproduce el reparto oficial", (_, c) => {
    const r = repartir({
      escanos: c.escanos,
      esMayoritaria: c.esMayoritaria,
      votosBlanco: c.votosBlanco,
      votosNulos: c.votosNulos,
      candidaturas: c.candidaturas.map((x) => ({ id: x.codigo, votos: x.votos })),
    });
    expect(r.requiereSorteo).toBeNull();
    for (const x of c.candidaturas) expect(r.escanos[x.codigo], x.siglas).toBe(x.escanosOficiales);
  });

  it("el agregado nacional reproduce la composición oficial del Congreso", () => {
    const porGrupo: Record<string, number> = {};
    for (const c of circs) {
      const r = repartir({
        escanos: c.escanos,
        esMayoritaria: c.esMayoritaria,
        votosBlanco: c.votosBlanco,
        votosNulos: c.votosNulos,
        candidaturas: c.candidaturas.map((x) => ({ id: x.codigo, votos: x.votos })),
      });
      for (const x of c.candidaturas) {
        const g = ELECCION_ACTUAL.gruposNacionales[x.cabeceraNacional]?.etiqueta ?? x.siglas;
        porGrupo[g] = (porGrupo[g] ?? 0) + r.escanos[x.codigo];
      }
    }
    const conEscanos = Object.fromEntries(Object.entries(porGrupo).filter(([, v]) => v > 0));
    expect(conEscanos).toEqual({
      PP: 137,
      PSOE: 121,
      VOX: 33,
      SUMAR: 31,
      ERC: 7,
      JUNTS: 7,
      "EH Bildu": 6,
      "EAJ-PNV": 5,
      BNG: 1,
      CCa: 1,
      UPN: 1,
    });
  });

  it("el manifiesto documenta la procedencia", () => {
    const m = ELECCION_ACTUAL.manifest;
    expect(m.fuente.url).toMatch(/^https:\/\/infoelectoral\.interior\.gob\.es\//);
    expect(m.fuente.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(m.fuente.fechaDescarga).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(m.tipoDato).toBe("oficial");
  });
});
