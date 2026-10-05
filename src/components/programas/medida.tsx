"use client";

import { CheckIcon, ExternalLinkIcon, FileQuestionIcon, XIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CRITERIOS, calcularConcrecion, resumenEn, type Medida, type PartidoPrograma } from "@/domain/programas";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ConcrecionDots } from "./concrecion-dots";

export function MedidaCard({ medida, partido, compact }: { medida: Medida; partido: PartidoPrograma; compact?: boolean }) {
  const t = useTranslations("programs");
  const locale = useLocale() as AppLocale;
  const c = calcularConcrecion(medida.criterios);
  const nivel = t(`levels.${c.nivel}`);

  return (
    <article className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {medida.ilustrativa && <Badge variant="secondary">{t("illustrative")}</Badge>}
        {!medida.cita && <Badge variant="outline">{t("pendingSource")}</Badge>}
      </div>
      <p className={cn("leading-snug font-medium text-pretty", compact ? "text-sm" : "text-[0.95rem]")}>{resumenEn(medida, locale)}</p>
      <div className="flex items-center gap-2" aria-label={t("scoreLong", { total: c.total, level: nivel })} role="group">
        <ConcrecionDots total={c.total} />
        <span className="text-xs font-semibold tabular">{t("score", { total: c.total })}</span>
        <span className="text-xs text-muted-foreground">· {nivel}</span>
      </div>
      <ul className="flex flex-wrap gap-1">
        {CRITERIOS.map((k) => {
          const ok = medida.criterios[k];
          const nombre = t(`criteria.${k}`);
          return (
            <li key={k}>
              <span
                title={t(`criteriaHelp.${k}`)}
                aria-label={ok ? t("criterionMet", { criterion: nombre }) : t("criterionNotMet", { criterion: nombre })}
                className={cn(
                  "inline-flex h-5 items-center gap-0.5 rounded-[4px] border px-1.5 text-[0.68rem] font-medium",
                  ok ? "border-primary bg-primary text-primary-foreground" : "border-dashed text-muted-foreground",
                )}
              >
                {ok ? <CheckIcon aria-hidden className="size-3" /> : <XIcon aria-hidden className="size-3" />}
                {nombre}
              </span>
            </li>
          );
        })}
      </ul>
      <CitaDialog medida={medida} partido={partido} resumen={resumenEn(medida, locale)} />
    </article>
  );
}

function CitaDialog({ medida, partido, resumen }: { medida: Medida; partido: PartidoPrograma; resumen: string }) {
  const t = useTranslations("programs");
  const format = useFormatter();
  const fecha = (d: string) => format.dateTime(new Date(d), { dateStyle: "medium" });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto self-start px-0 text-xs">
          {t("viewQuote")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("quoteTitle", { party: partido.siglas })}</DialogTitle>
          <DialogDescription>{t("quoteLanguage")}</DialogDescription>
        </DialogHeader>
        {medida.cita ? (
          <figure className="flex flex-col gap-2">
            <blockquote lang={medida.cita.idioma} className="border-l-4 border-primary pl-4 text-[0.95rem] leading-relaxed italic">
              {medida.cita.texto}
            </blockquote>
            <figcaption className="text-xs text-muted-foreground">{t("pages", { pages: medida.cita.paginas })}</figcaption>
          </figure>
        ) : (
          <Empty className="border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileQuestionIcon />
              </EmptyMedia>
              <EmptyTitle>{t("pendingSource")}</EmptyTitle>
              <EmptyDescription>{t("pendingSourceLong")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">{t("measureSummary")}</dt>
          <dd>{resumen}</dd>
          <dt className="text-muted-foreground">{t("reviewLabel")}</dt>
          <dd>
            {t(`review.${medida.revision.estado}`)}
            {medida.revision.revisor && medida.revision.fecha && (
              <> · {t("reviewedBy", { who: medida.revision.revisor, date: fecha(medida.revision.fecha) })}</>
            )}
          </dd>
          {partido.programa?.fechaPublicacion && (
            <>
              <dt className="text-muted-foreground">{t("publishedLabel")}</dt>
              <dd>{fecha(partido.programa.fechaPublicacion)}</dd>
            </>
          )}
          {partido.programa?.fechaConsulta && (
            <>
              <dt className="text-muted-foreground">{t("consultedLabel")}</dt>
              <dd>{fecha(partido.programa.fechaConsulta)}</dd>
            </>
          )}
        </dl>
        <DialogFooter>
          {partido.programa ? (
            <Button asChild variant="outline">
              <a href={partido.programa.url} target="_blank" rel="noopener noreferrer">
                {t("openProgram")}
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">{t("noProgram")}</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
