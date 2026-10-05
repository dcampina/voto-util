import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type messages from "@/messages/es.json";
import { routing, type AppLocale } from "./routing";

export function asLocale(value: string): AppLocale {
  if (!hasLocale(routing.locales, value)) notFound();
  return value;
}

/** Claves de datos (ids de categorías y subtemas); los tests garantizan su traducción. */
export type CategoriaKey = keyof typeof messages.categories;
export type SubtemaKey = keyof typeof messages.subtopics;
