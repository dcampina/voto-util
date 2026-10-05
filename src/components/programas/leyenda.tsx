import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRITERIOS, NIVELES } from "@/domain/programas";
import { ConcrecionDots } from "./concrecion-dots";

const EJEMPLO_NIVEL = { generica: 1, basica: 2, desarrollada: 3, detallada: 5 } as const;

export async function LeyendaConcrecion() {
  const t = await getTranslations("programs");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("legendTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <ol className="flex flex-col gap-2.5">
          {CRITERIOS.map((k, i) => (
            <li key={k} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground tabular">{i + 1}.</span>
              <span>
                <strong className="font-semibold">{t(`criteria.${k}`)}</strong>
                <span className="text-muted-foreground"> — {t(`criteriaHelp.${k}`)}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {NIVELES.map((n) => (
              <li key={n} className="flex items-center gap-3 text-sm">
                <ConcrecionDots total={EJEMPLO_NIVEL[n]} />
                <span className="font-medium">{t(`levels.${n}`)}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{t(`levelRanges.${n}`)}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-muted/70 p-3 text-xs">
            <p className="font-semibold">{t("notMeasuresTitle")}</p>
            <p className="mt-1 text-muted-foreground">{t("notMeasures")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
