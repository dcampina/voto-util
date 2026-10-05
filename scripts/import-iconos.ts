/**
 * Descarga el favicon de la web oficial de cada partido (src/data/partidos/webs.json)
 * y genera:
 *
 *   public/partidos/<id>.<ext>
 *   src/data/partidos/iconos.json   (origen, fecha, tamaño y SHA-256 de cada fichero)
 *
 * Uso:
 *   npm run data:iconos
 *
 * Los ficheros se guardan tal cual se publican, sin modificar. Se descartan los
 * SVG (podrían contener scripts al servirse desde este dominio) y cualquier
 * respuesta que no sea una imagen.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WEBS = join(ROOT, "src", "data", "partidos", "webs.json");
const OUT_JSON = join(ROOT, "src", "data", "partidos", "iconos.json");
const OUT_DIR = join(ROOT, "public", "partidos");
const MAX_BYTES = 512 * 1024;
const TAMANO_IDEAL = 96;

// Varias webs rechazan peticiones sin User-Agent de navegador.
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5",
};

type Tipo = "png" | "ico" | "bmp" | "jpg" | "gif" | "webp";

interface Icono {
  archivo: string;
  origen: string;
  tipo: Tipo;
  bytes: number;
  sha256: string;
  nota?: string;
}

function tipoDe(buf: Buffer): Tipo | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf[0] === 0 && buf[1] === 0 && (buf[2] === 1 || buf[2] === 2) && buf[3] === 0) return "ico";
  if (buf.subarray(0, 2).toString("latin1") === "BM") return "bmp";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 4).toString("latin1") === "GIF8") return "gif";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

function atributo(tag: string, nombre: string): string | null {
  const m = tag.match(new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? null) : null;
}

/** Iconos declarados en el HTML, ordenados del más adecuado al menos. */
function candidatosDeclarados(html: string, base: string): string[] {
  const out: { url: string; puntos: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = atributo(tag, "rel")?.toLowerCase() ?? "";
    if (!rel.split(/\s+/).some((r) => r === "icon" || r === "apple-touch-icon" || r === "apple-touch-icon-precomposed")) continue;
    const href = atributo(tag, "href");
    if (!href || href.startsWith("data:")) continue;
    let url: URL;
    try {
      url = new URL(href.replaceAll("&amp;", "&"), base);
    } catch {
      continue;
    }
    if (/\.svg($|\?)/i.test(url.pathname) || atributo(tag, "type")?.includes("svg")) continue;
    // Imágenes genéricas de WordPress, no del partido.
    if (url.pathname.includes("/wp-includes/")) continue;
    const lado = Number.parseInt(atributo(tag, "sizes")?.split("x")[0] ?? "", 10) || 0;
    const puntos = lado >= 48 ? 1000 - Math.abs(lado - TAMANO_IDEAL) : lado;
    out.push({ url: url.href, puntos });
  }
  return [...new Map(out.sort((a, b) => b.puntos - a.puntos).map((c) => [c.url, c])).keys()];
}

async function descargar(url: string): Promise<Response | null> {
  try {
    return await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(15_000) });
  } catch {
    return null;
  }
}

async function buscarIcono(
  web: string,
  forzado?: string,
): Promise<{ url: string; buf: Buffer; tipo: Tipo } | { error: string }> {
  const candidatos: string[] = forzado ? [forzado] : [];
  const pagina = forzado ? null : await descargar(web);
  const base = pagina?.url || web;
  if (pagina?.ok && pagina.headers.get("content-type")?.includes("html")) {
    candidatos.push(...candidatosDeclarados(await pagina.text(), base));
  }
  if (!forzado) {
    for (const origen of new Set([new URL(base).origin, new URL(web).origin])) candidatos.push(`${origen}/favicon.ico`);
  }

  for (const url of new Set(candidatos)) {
    const res = await descargar(url);
    if (!res?.ok || res.url.includes("/wp-includes/")) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) continue;
    const tipo = tipoDe(buf);
    if (tipo) return { url: res.url || url, buf, tipo };
  }
  if (forzado) return { error: `el icono indicado (${forzado}) no es una imagen válida` };
  return { error: pagina ? `HTTP ${pagina.status} y ningún icono válido` : "la web no responde" };
}

async function main() {
  const { _nota, ...webs } = JSON.parse(readFileSync(WEBS, "utf8")) as Record<string, { web: string; icono?: string; notaIcono?: string }> & {
    _nota: string;
  };
  void _nota;
  mkdirSync(OUT_DIR, { recursive: true });

  const iconos: Record<string, Icono> = {};
  const sinIcono: Record<string, string> = {};
  for (const [id, { web, icono, notaIcono }] of Object.entries(webs)) {
    const r = await buscarIcono(web, icono);
    for (const f of readdirSync(OUT_DIR)) if (f.startsWith(`${id}.`)) rmSync(join(OUT_DIR, f));
    if ("error" in r) {
      sinIcono[id] = r.error;
      console.warn(`✗ ${id}: ${r.error}`);
      continue;
    }
    const archivo = `${id}.${r.tipo}`;
    writeFileSync(join(OUT_DIR, archivo), r.buf);
    iconos[id] = {
      archivo: `/partidos/${archivo}`,
      origen: r.url,
      tipo: r.tipo,
      bytes: r.buf.length,
      sha256: createHash("sha256").update(r.buf).digest("hex"),
      ...(notaIcono && { nota: notaIcono }),
    };
    console.log(`✓ ${id}: ${r.url}`);
  }

  const salida = {
    _nota:
      "Generado por scripts/import-iconos.ts. Favicons descargados sin modificar de la web oficial de cada partido; son propiedad de sus titulares y se usan solo para identificar a cada candidatura junto a sus siglas.",
    fechaDescarga: new Date().toISOString().slice(0, 10),
    iconos,
    sinIcono,
  };
  writeFileSync(OUT_JSON, `${JSON.stringify(salida, null, 2)}\n`);
  console.log(`\n${Object.keys(iconos).length} iconos, ${Object.keys(sinIcono).length} sin icono → ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
