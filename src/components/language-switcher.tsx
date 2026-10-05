"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_NAMES, LOCALES, type AppLocale } from "@/i18n/routing";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    startTransition(() => {
      // Conserva el escenario del simulador (query) y el ancla al cambiar de idioma.
      router.replace(`${pathname}${window.location.search}${window.location.hash}`, {
        locale: next as AppLocale,
        scroll: false,
      });
    });
  }

  return (
    <Select value={locale} onValueChange={change} disabled={pending}>
      <SelectTrigger size="sm" aria-label={t("language")} className={className}>
        <LanguagesIcon aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {LOCALES.map((l) => (
            <SelectItem key={l} value={l} lang={l}>
              {LOCALE_NAMES[l]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
