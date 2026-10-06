import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { domainToUnicode } from "node:url";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { ConcrecionDots } from "@/components/programas/concrecion-dots";
import { FuentesProgramas } from "@/components/programas/fuentes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyIcon } from "@/components/party-chip";
import { ELECCION_ACTUAL } from "@/data/elecciones";
import { PROGRAMAS } from "@/data/programas";
import { FECHA_ICONOS, ICONOS, WEBS_PARTIDOS } from "@/data/partidos";
import { CRITERIOS, NIVELES } from "@/domain/programas";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/metodologia">): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("methodologyTitle") };
}

const EJEMPLO_NIVEL = { generica: 1, basica: 2, desarrollada: 3, detallada: 5 } as const;

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.95rem] marker:text-muted-foreground">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export default async function MetodologiaPage({ params }: PageProps<"/[locale]/metodologia">) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("methodology");
  const tp = await getTranslations("programs");
  const tn = await getTranslations("nav");
  const format = await getFormatter();
  const m = ELECCION_ACTUAL.manifest;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6">
      <PageHeader kicker={tn("methodology")} title={t("title")} className="pb-2">
        <p>{t("intro")}</p>
      </PageHeader>

      <Card id="reglas">
        <CardHeader>
          <CardTitle className="text-lg">{t("rulesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Lista
            items={(["constituency", "threshold", "valid", "dhondt", "ties", "majoritarian", "exact"] as const).map((k) => t(`rules.${k}`))}
          />
          <a href={SITE.lawUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
            {t("lawLink")}
            <ExternalLinkIcon aria-hidden className="size-3.5" />
          </a>
        </CardContent>
      </Card>

      <Card id="datos">
        <CardHeader>
          <CardTitle className="text-lg">{t("dataTitle")}</CardTitle>
          <CardDescription>{t("dataIntro")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
            <dt className="text-muted-foreground">{t("dataFields.source")}</dt>
            <dd>{m.fuente.organismo}</dd>
            <dt className="text-muted-foreground">{t("dataFields.file")}</dt>
            <dd className="break-all">
              <a href={m.fuente.url} className="underline underline-offset-4" rel="noopener noreferrer">
                {m.fuente.url}
              </a>
            </dd>
            <dt className="text-muted-foreground">{t("dataFields.format")}</dt>
            <dd>{m.fuente.formatoOriginal}</dd>
            <dt className="text-muted-foreground">{t("dataFields.files")}</dt>
            <dd>{format.list(m.fuente.ficherosUsados, { type: "conjunction" })}</dd>
            <dt className="text-muted-foreground">{t("dataFields.downloaded")}</dt>
            <dd className="tabular">{format.dateTime(new Date(m.fuente.fechaDescarga), { dateStyle: "long" })}</dd>
            <dt className="text-muted-foreground">{t("dataFields.hash")}</dt>
            <dd className="font-mono text-xs break-all">{m.fuente.sha256}</dd>
            <dt className="text-muted-foreground">{t("dataFields.type")}</dt>
            <dd>{m.tipoDato === "oficial" ? t("dataTypeOfficial") : m.tipoDato}</dd>
            <dt className="text-muted-foreground">{t("dataFields.license")}</dt>
            <dd>{m.fuente.condicionesReutilizacion}</dd>
          </dl>
          <p className="rounded-lg border-l-4 border-primary bg-muted/60 px-4 py-3 text-sm">{t("dataValidation")}</p>
        </CardContent>
      </Card>

      <Card id="iconos">
        <CardHeader>
          <CardTitle className="text-lg">{t("iconsTitle")}</CardTitle>
          <CardDescription>{t("iconsIntro", { date: format.dateTime(new Date(FECHA_ICONOS), { dateStyle: "long" }) })}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Lista items={(["selfHosted", "unmodified", "federations", "missing", "rights"] as const).map((k) => t(`icons.${k}`))} />
          <ul aria-label={t("iconsListLabel")} className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
            {Object.entries(WEBS_PARTIDOS).map(([id, p]) => {
              const icono = ICONOS[id];
              return (
                <li key={id} className="flex min-w-0 items-start gap-2.5">
                  {icono ? <PartyIcon src={icono.archivo} className="mt-0.5" /> : <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-[3px] border border-dashed" />}
                  <span className="flex min-w-0 flex-col">
                    <a href={p.web} target="_blank" rel="noopener noreferrer" className="truncate font-medium underline-offset-4 hover:underline">
                      {p.nombre}
                    </a>
                    <span className="truncate text-xs text-muted-foreground">
                      {icono ? (
                        <>
                          {t("iconsSource")}: <span className="font-mono">{domainToUnicode(new URL(icono.origen).hostname)}</span>
                        </>
                      ) : (
                        t("iconsNone")
                      )}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card id="indice" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-lg">{t("indexTitle")}</CardTitle>
          <CardDescription>{t("indexIntro")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm marker:text-muted-foreground">
            {CRITERIOS.map((k) => (
              <li key={k}>
                <strong className="font-semibold">{tp(`criteria.${k}`)}</strong>
                <span className="text-muted-foreground"> — {tp(`criteriaHelp.${k}`)}</span>
              </li>
            ))}
            </ol>
            <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {NIVELES.map((n) => (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <ConcrecionDots total={EJEMPLO_NIVEL[n]} />
                  <span className="font-medium">{tp(`levels.${n}`)}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{tp(`levelRanges.${n}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              <strong className="font-semibold text-foreground">{tp("notMeasuresTitle")}:</strong> {tp("notMeasures")}
            </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("fundingNote")}</p>
        </CardContent>
      </Card>

      <Card id="programas">
        <CardHeader>
          <CardTitle className="text-lg">{t("programsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Lista items={(["source", "thirdParty", "quote", "coverage", "pending"] as const).map((k) => t(`programs.${k}`))} />
          {!PROGRAMAS.esEjemplo && (
            <div className="mt-6">
              <FuentesProgramas datos={PROGRAMAS} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card id="privacidad">
          <CardHeader>
            <CardTitle className="text-lg">{t("privacyTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Lista items={(["static", "noCookies", "local", "noProfile"] as const).map((k) => t(`privacy.${k}`))} />
          </CardContent>
        </Card>
        <Card id="limitaciones">
          <CardHeader>
            <CardTitle className="text-lg">{t("limitsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Lista items={(["scenario", "colors", "translations"] as const).map((k) => t(`limits.${k}`))} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
