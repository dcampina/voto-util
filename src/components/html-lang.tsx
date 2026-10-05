"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Mantiene html[lang] al cambiar de idioma con navegación en cliente. */
export function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
