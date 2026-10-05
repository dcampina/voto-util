import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/lib/site";

export async function SiteFooter() {
  const t = await getTranslations();
  return (
    <footer className="mt-20 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <p className="max-w-md text-sm text-muted-foreground">{t("footer.privacy")}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm md:items-end">
          <nav aria-label={t("nav.methodology")} className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/simulador" className="hover:underline">
              {t("nav.simulator")}
            </Link>
            <Link href="/programas" className="hover:underline">
              {t("nav.programs")}
            </Link>
            <Link href="/metodologia" className="hover:underline">
              {t("nav.methodology")}
            </Link>
            {SITE.repoUrl && (
              <a href={SITE.repoUrl} className="hover:underline" rel="noopener">
                {t("footer.code")}
              </a>
            )}
          </nav>
          <Separator className="md:hidden" />
          <p className="max-w-sm text-xs text-muted-foreground md:text-right">{t("footer.source")}</p>
        </div>
      </div>
    </footer>
  );
}
