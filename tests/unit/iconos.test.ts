import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ELECCIONES, grupoDe } from "@/data/elecciones";
import { ICONOS, ICONOS_SIN_FICHERO, WEBS_PARTIDOS, iconoCabecera } from "@/data/partidos";
import { PROGRAMAS } from "@/data/programas";

const PUBLIC = resolve(import.meta.dirname, "../../public");

describe("iconos de los partidos", () => {
  it("cada partido con web tiene icono o un motivo registrado", () => {
    for (const id of Object.keys(WEBS_PARTIDOS)) {
      expect(id in ICONOS || id in ICONOS_SIN_FICHERO, id).toBe(true);
    }
  });

  it("los ficheros existen, coinciden con su SHA-256 y no hay huérfanos", () => {
    for (const [id, icono] of Object.entries(ICONOS)) {
      const ruta = join(PUBLIC, icono.archivo);
      expect(existsSync(ruta), id).toBe(true);
      const buf = readFileSync(ruta);
      expect(buf.length, id).toBe(icono.bytes);
      expect(createHash("sha256").update(buf).digest("hex"), id).toBe(icono.sha256);
    }
    const esperados = new Set(Object.values(ICONOS).map((i) => i.archivo.split("/").pop()));
    expect(readdirSync(join(PUBLIC, "partidos")).filter((f) => !esperados.has(f))).toEqual([]);
  });

  it("solo hay formatos de imagen rasterizados (sin SVG)", () => {
    for (const icono of Object.values(ICONOS)) {
      expect(["png", "ico", "bmp", "jpg", "gif", "webp"]).toContain(icono.tipo);
      expect(icono.archivo).not.toMatch(/\.svg$/i);
    }
  });

  it("las cabeceras apuntan a candidaturas reales de cada elección", () => {
    for (const [id, p] of Object.entries(WEBS_PARTIDOS)) {
      for (const [eleccionId, codigo] of Object.entries(p.cabeceras)) {
        const eleccion = ELECCIONES[eleccionId];
        expect(eleccion, `${id}: ${eleccionId}`).toBeDefined();
        const existe = eleccion.circunscripciones.some((c) => c.candidaturas.some((x) => x.cabeceraNacional === codigo));
        expect(existe, `${id}: ${codigo}`).toBe(true);
      }
    }
  });

  it("todas las candidaturas con escaño en 2023 tienen icono", () => {
    const eleccion = ELECCIONES["congreso-2023-07"];
    const conEscano = new Set(
      eleccion.circunscripciones.flatMap((c) => c.candidaturas.filter((x) => x.escanosOficiales > 0).map((x) => x.cabeceraNacional)),
    );
    for (const codigo of conEscano) expect(iconoCabecera(eleccion.id, codigo), codigo).toBeDefined();
  });

  it("las federaciones usan el icono de su cabecera nacional", () => {
    const eleccion = ELECCIONES["congreso-2023-07"];
    const psc = eleccion.circunscripciones.find((c) => c.codigoINE === "08")!.candidaturas.find((x) => x.siglas === "PSC")!;
    expect(grupoDe(eleccion, psc.cabeceraNacional, psc.siglas).icono).toBe(ICONOS.psoe.archivo);
  });

  it("todos los partidos del comparador tienen icono", () => {
    for (const p of PROGRAMAS.partidos) expect(ICONOS[p.id], p.id).toBeDefined();
  });
});
