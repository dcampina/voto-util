import { ArrowRightIcon, CheckIcon, CookieIcon, CpuIcon, FileTextIcon, ScaleIcon } from "lucide-react";
import { asLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hemicycle } from "@/components/charts/hemicycle";
import { SeatBar } from "@/components/charts/seat-bar";
import { ConcrecionDots } from "@/components/programas/concrecion-dots";
import { PartyDot, PartyIcon } from "@/components/party-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ELECCION_ACTUAL } from "@/data/elecciones";
import { PROGRAMAS } from "@/data/programas";
import { agregadoNacional } from "@/domain/escenario";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/lib/site";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const ts = await getTranslations("simulator");

  const grupos = agregadoNacional(ELECCION_ACTUAL).map((g) => ({
    id: g.grupo,
    label: g.etiqueta,
    color: g.color,
    icon: g.icono,
    seats: g.escanos,
  }));
  const resumen = grupos.map((g) => `${g.label} ${tc("seats", { count: g.seats })}`).join(", ");

  const principles = [
    { icon: ScaleIcon, text: t("principles.noAdvice") },
    { icon: CookieIcon, text: t("principles.noTracking") },
    { icon: CpuIcon, text: t("principles.local") },
    { icon: FileTextIcon, text: t("principles.sources") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 pt-10 sm:px-6 sm:pt-16">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <p className="kicker">{t("eyebrow")}</p>
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02]">
            {t("title")}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t("lead")}</p>
          <ul className="flex flex-wrap gap-2">
            {principles.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Badge variant="outline" className="h-7 gap-1.5 bg-card px-2.5 text-xs">
                  <Icon aria-hidden />
                  {text}
                </Badge>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 px-5 text-[0.95rem]">
              <Link href="/simulador">
                {t("simulatorCta")}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5 text-[0.95rem]">
              <Link href="/programas">{t("programsCta")}</Link>
            </Button>
          </div>
        </div>

        <Card className="gap-4">
          <CardHeader>
            <p className="kicker">{tc("officialData")} · 23J 2023</p>
            <CardTitle className="text-lg">{t("congressTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <figure className="flex flex-col items-center">
              <Hemicycle groups={grupos} total={350} majority={176} label={ts("nationalAria", { summary: resumen })} />
              <figcaption className="kicker -mt-1">{ts("majority", { count: 176 })}</figcaption>
            </figure>
            <SeatBar groups={grupos} total={350} label={resumen} />
            <ul className="grid grid-cols-3 gap-x-3 gap-y-1 overflow-hidden text-xs sm:grid-cols-4">
              {grupos.map((g) => (
                <li
                  key={g.id}
                  className="relative flex items-center gap-1.5 before:absolute before:-inset-y-1 before:-left-1.5 before:w-px before:-translate-x-1/2 before:bg-border before:content-[''] max-sm:nth-[3n+1]:before:hidden sm:nth-[4n+1]:before:hidden"
                >
                  <PartyDot color={g.color} className="size-2" />
                  <PartyIcon src={g.icon} className="size-3.5" />
                  <span className="truncate">{g.label}</span>
                  <span className="ml-auto font-semibold tabular">{g.seats}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">{t("congressCaption")}</p>
          </CardFooter>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="group">
          <CardHeader>
            <p className="kicker">{t("simulatorKicker")}</p>
            <CardTitle className="text-2xl font-extrabold tracking-tight">{t("simulatorTitle")}</CardTitle>
            <CardDescription className="text-base">{t("simulatorText")}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <p className="font-mono text-xs text-muted-foreground tabular">{t("simulatorStats")}</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/simulador">
                {t("simulatorCta")}
                <ArrowRightIcon data-icon="inline-end" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="group">
          <CardHeader>
            <p className="kicker">{t("programsKicker")}</p>
            <CardTitle className="text-2xl font-extrabold tracking-tight">{t("programsTitle")}</CardTitle>
            <CardDescription className="text-base">{t("programsText")}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex items-center gap-3">
            <ConcrecionDots total={3} />
            <Badge variant="secondary">{PROGRAMAS.esEjemplo ? tc("exampleData") : t("programsBadge")}</Badge>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/programas">
                {t("programsCta")}
                <ArrowRightIcon data-icon="inline-end" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section aria-labelledby="sobre" className="grid gap-6 border-t pt-10 md:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)]">
        <h2 id="sobre" className="text-xl font-extrabold tracking-tight">
          {t("aboutTitle")}
        </h2>
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2.5">
            {(["independent", "data", "quotes", "privacy", ...(SITE.repoUrl ? (["code"] as const) : [])] as const).map((k) => (
              <li key={k} className="flex gap-2.5 text-[0.95rem]">
                <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {k === "code" ? (
                  <a href={SITE.repoUrl} className="underline underline-offset-4" rel="noopener">
                    {t(`about.${k}`)}
                  </a>
                ) : (
                  t(`about.${k}`)
                )}
              </li>
            ))}
          </ul>
          <Link href="/metodologia" className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
            {t("methodologyLink")}
            <ArrowRightIcon aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
