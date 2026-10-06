import { ArrowRightIcon, FlaskConicalIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import { Comparador } from "@/components/programas/comparador";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PROGRAMAS } from "@/data/programas";

export async function generateMetadata({ params }: PageProps<"/[locale]/programas">): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("programsTitle") };
}

export default async function ProgramasPage({ params }: PageProps<"/[locale]/programas">) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("programs");
  const tm = await getTranslations("methodology");
  const tn = await getTranslations("nav");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
      <PageHeader kicker={tn("programs")} title={t("title")} className="pb-2">
        <p>{t("intro")}</p>
        <Button asChild variant="outline" className="mt-1 w-fit self-start text-foreground">
          <Link href="/metodologia">
            {tm("title")}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </PageHeader>
      {PROGRAMAS.esEjemplo && (
        <Alert className="border-warning-foreground/30 bg-warning text-warning-foreground">
          <FlaskConicalIcon />
          <AlertTitle>{t("exampleTitle")}</AlertTitle>
          <AlertDescription className="text-warning-foreground">{t("exampleText")}</AlertDescription>
        </Alert>
      )}
      <Comparador datos={PROGRAMAS} />
    </div>
  );
}
