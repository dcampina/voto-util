/**
 * Importa los resultados del Congreso desde el área de descargas de
 * Infoelectoral (Ministerio del Interior) y genera:
 *
 *   src/data/elecciones/<id>/circunscripciones.json
 *   src/data/elecciones/<id>/manifest.json
 *
 * Uso:
 *   npm run data:import                      # descarga 02202307_TOTA.zip
 *   npm run data:import -- --zip ruta.zip    # usa un ZIP ya descargado
 *
 * Formato: ficheros de registro fijo descritos en FICHEROS.doc (incluido
 * en el propio ZIP). Se leen como latin1 para que cada carácter ocupe un byte.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ELECCION = {
  id: "congreso-2023-07",
  tipo: "02",
  anio: "2023",
  mes: "07",
  fecha: "2023-07-23",
  nombre: "Elecciones Generales 2023 — Congreso de los Diputados",
};

const ZIP_NAME = `${ELECCION.tipo}${ELECCION.anio}${ELECCION.mes}_TOTA.zip`;
const SOURCE_URL = `https://infoelectoral.interior.gob.es/estaticos/docxl/apliextr/${ZIP_NAME}`;
const ROOT = resolve(import.meta.dirname, "..");
const RAW_DIR = join(ROOT, "data-raw");
const OUT_DIR = join(ROOT, "src", "data", "elecciones", ELECCION.id);
const CEUTA_MELILLA = new Set(["51", "52"]);

function field(line: string, start: number, end: number): string {
  return line.slice(start - 1, end).trim();
}
function num(line: string, start: number, end: number): number {
  const raw = field(line, start, end);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) throw new Error(`Campo numérico inválido [${start}-${end}]: "${raw}"`);
  return n;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function obtenerZip(argZip?: string): Promise<{ path: string; descargado: boolean }> {
  if (argZip) return { path: resolve(argZip), descargado: false };
  mkdirSync(RAW_DIR, { recursive: true });
  const dest = join(RAW_DIR, ZIP_NAME);
  if (existsSync(dest)) return { path: dest, descargado: false };
  // El servidor del Ministerio corta conexiones sin User-Agent de navegador.
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; voto-util data import)" },
  });
  if (!res.ok) throw new Error(`Descarga fallida (${res.status}) ${SOURCE_URL}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return { path: dest, descargado: true };
}

function leerDat(zipPath: string, codigo: string): string[] {
  const name = `${codigo}${ELECCION.tipo}${ELECCION.anio.slice(2)}${ELECCION.mes}.DAT`;
  const buf = execFileSync("unzip", ["-p", zipPath, name], { maxBuffer: 64 * 1024 * 1024 });
  return buf
    .toString("latin1")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
}

interface CandidaturaRaw {
  codigo: string;
  siglas: string;
  denominacion: string;
  cabeceraNacional: string;
}

async function main() {
  const argIdx = process.argv.indexOf("--zip");
  const { path: zipPath, descargado } = await obtenerZip(argIdx > -1 ? process.argv[argIdx + 1] : undefined);
  const zipBuf = readFileSync(zipPath);
  const sha256 = createHash("sha256").update(zipBuf).digest("hex");

  // ── 03: candidaturas ────────────────────────────────────────────────
  const candidaturas = new Map<string, CandidaturaRaw>();
  for (const l of leerDat(zipPath, "03")) {
    const codigo = field(l, 9, 14);
    candidaturas.set(codigo, {
      codigo,
      siglas: field(l, 15, 64),
      denominacion: field(l, 65, 214),
      cabeceraNacional: field(l, 227, 232),
    });
  }

  // ── 07: datos comunes por circunscripción (provincia, distrito 9) ───
  type Circ = {
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
    candidaturas: {
      codigo: string;
      siglas: string;
      denominacion: string;
      cabeceraNacional: string;
      votos: number;
      escanosOficiales: number;
    }[];
  };
  const circs = new Map<string, Circ>();
  for (const l of leerDat(zipPath, "07")) {
    const prov = field(l, 12, 13);
    const distrito = field(l, 14, 14);
    if (prov === "99" || distrito !== "9") continue;
    const nombre = field(l, 15, 64);
    circs.set(prov, {
      codigoINE: prov,
      slug: slugify(nombre),
      nombre,
      escanos: num(l, 150, 155),
      esMayoritaria: CEUTA_MELILLA.has(prov),
      censoEscrutinio: num(l, 86, 93),
      votosBlanco: num(l, 126, 133),
      votosNulos: num(l, 134, 141),
      votosCandidaturas: num(l, 142, 149),
      datosOficiales: field(l, 172, 172) === "S",
      candidaturas: [],
    });
  }

  // ── 08: votos y escaños por candidatura y circunscripción ──────────
  for (const l of leerDat(zipPath, "08")) {
    const prov = field(l, 12, 13);
    const distrito = field(l, 14, 14);
    if (prov === "99" || distrito !== "9") continue;
    const circ = circs.get(prov);
    if (!circ) continue;
    const codigo = field(l, 15, 20);
    const cand = candidaturas.get(codigo);
    if (!cand) throw new Error(`Candidatura ${codigo} no encontrada en fichero 03`);
    circ.candidaturas.push({
      ...cand,
      votos: num(l, 21, 28),
      escanosOficiales: num(l, 29, 33),
    });
  }

  const lista = [...circs.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  for (const c of lista) {
    c.candidaturas.sort((a, b) => b.votos - a.votos);
    const suma = c.candidaturas.reduce((s, x) => s + x.votos, 0);
    if (suma !== c.votosCandidaturas) {
      throw new Error(`${c.nombre}: la suma de votos (${suma}) no coincide con el total (${c.votosCandidaturas})`);
    }
  }
  const totalEscanos = lista.reduce((s, c) => s + c.escanos, 0);
  if (lista.length !== 52 || totalEscanos !== 350) {
    throw new Error(`Se esperaban 52 circunscripciones y 350 escaños; hay ${lista.length} y ${totalEscanos}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "circunscripciones.json"),
    JSON.stringify({ eleccionId: ELECCION.id, circunscripciones: lista }, null, 1) + "\n",
  );

  const manifest = {
    eleccion: ELECCION,
    fuente: {
      organismo: "Ministerio del Interior — Infoelectoral (área de descargas)",
      url: SOURCE_URL,
      formatoOriginal: "ZIP con ficheros de registro fijo (.DAT), codificación ANSI/latin1",
      especificacion: "FICHEROS.doc incluido en el ZIP",
      ficherosUsados: ["03 (candidaturas)", "07 (datos comunes por circunscripción)", "08 (votos y escaños por candidatura)"],
      sha256,
      fechaDescarga: (descargado ? new Date() : statSync(zipPath).mtime).toISOString().slice(0, 10),
      condicionesReutilizacion:
        "Información del sector público reutilizable conforme a la Ley 37/2007; citar la fuente (Ministerio del Interior).",
    },
    tipoDato: lista.every((c) => c.datosOficiales) ? "oficial" : "mixto: ver campo datosOficiales por circunscripción",
    circunscripcionesSinMarcaOficial: lista.filter((c) => !c.datosOficiales).map((c) => c.nombre),
    notasTransformacion: [
      "Se usan solo los registros de ámbito provincial (distrito 9); Ceuta y Melilla se marcan como mayoritarias.",
      "Se conservan siglas y denominaciones tal como figuran en el fichero 03.",
      "Votos válidos = votos a candidaturas + votos en blanco. Los nulos se guardan aparte.",
      "escanosOficiales procede del fichero 08 y sirve para validar el motor de reparto.",
    ],
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`✓ ${lista.length} circunscripciones, ${totalEscanos} escaños → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
