/** Texto negro o blanco según la luminancia relativa del fondo (WCAG). */
export function textOn(hex: string): "#111111" | "#FFFFFF" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#111111";
  const n = Number.parseInt(m[1], 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  const contrastWhite = 1.05 / (L + 0.05);
  const contrastBlack = (L + 0.05) / (0.0111 + 0.05);
  return contrastWhite >= contrastBlack ? "#FFFFFF" : "#111111";
}
