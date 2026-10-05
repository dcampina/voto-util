import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { Simulador } from "@/components/simulador/simulador";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps<"/[locale]/simulador">): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("simulatorTitle") };
}

export default async function SimuladorPage({ params }: PageProps<"/[locale]/simulador">) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("simulator");
  const tn = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <PageHeader kicker={tn("simulator")} title={t("title")}>
        <p>{t("intro")}</p>
        <p>
          <Badge variant="secondary">{t("notPrediction")}</Badge>
        </p>
      </PageHeader>
      <Simulador />
    </div>
  );
}
