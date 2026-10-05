import { defineRouting } from "next-intl/routing";

export const LOCALES = ["es", "ca", "eu", "gl"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<AppLocale, string> = {
  es: "Castellano",
  ca: "Català",
  eu: "Euskara",
  gl: "Galego",
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "es",
  localePrefix: "always",
  // Exportación estática sin proxy: el idioma va en la URL y no se guarda en cookies.
  localeCookie: false,
  localeDetection: false,
});
