import { describe, expect, it } from "vitest";
import ca from "@/messages/ca.json";
import es from "@/messages/es.json";
import eu from "@/messages/eu.json";
import gl from "@/messages/gl.json";

type Tree = { [k: string]: string | Tree };

function claves(obj: Tree, prefijo = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefijo}${k}`] : claves(v, `${prefijo}${k}.`),
  );
}

function valores(obj: Tree): string[] {
  return Object.values(obj).flatMap((v) => (typeof v === "string" ? [v] : valores(v)));
}

const variables = (s: string) =>
  [...s.matchAll(/\{(\w+)(?:,|\})/g)].map((m) => m[1]).sort();

describe("traducciones", () => {
  const base = claves(es as Tree).sort();

  it.each([
    ["ca", ca],
    ["eu", eu],
    ["gl", gl],
  ])("%s tiene exactamente las mismas claves que es", (_, msgs) => {
    expect(claves(msgs as Tree).sort()).toEqual(base);
  });

  it.each([
    ["ca", ca],
    ["eu", eu],
    ["gl", gl],
  ])("%s usa las mismas variables de interpolación", (_, msgs) => {
    const get = (o: Tree, path: string) => path.split(".").reduce<Tree | string>((acc, k) => (acc as Tree)[k], o) as string;
    for (const k of base) {
      expect(variables(get(msgs as Tree, k)), k).toEqual(variables(get(es as Tree, k)));
    }
  });

  it("ningún texto queda vacío", () => {
    for (const msgs of [es, ca, eu, gl]) for (const v of valores(msgs as Tree)) expect(v.trim()).not.toBe("");
  });
});
