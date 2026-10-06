import { ExternalLinkIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { domainToUnicode } from "node:url";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WEBS_PARTIDOS } from "@/data/partidos";
import type { DatosComparador } from "@/domain/programas";

function host(url: string) {
  return domainToUnicode(new URL(url).hostname.replace(/^www\./, ""));
}

export async function FuentesProgramas({ datos }: { datos: DatosComparador }) {
  const t = await getTranslations("programs");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("sourcesTitle")}</CardTitle>
        <CardDescription>{t("sourcesIntro")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4">
          {datos.partidos.map((p) => {
            const programa = p.programa;
            const web = WEBS_PARTIDOS[p.id]?.web;
            const tercera = programa?.origen === "tercera";
            return (
              <li key={p.id} className="flex flex-col gap-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.siglas}</span>
                  <Badge variant={tercera ? "outline" : "secondary"}>{tercera ? t("thirdParty") : t("officialSource")}</Badge>
                </div>
                {programa ? (
                  <a href={programa.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                    {host(programa.url)}
                    <ExternalLinkIcon aria-hidden className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{t("noProgram")}</span>
                )}
                {tercera && programa?.editor && web && (
                  <p className="text-xs text-pretty text-muted-foreground">{t("thirdPartyNote", { web: host(web), editor: programa.editor })}</p>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
