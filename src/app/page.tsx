import type { Metadata } from "next";
import { LOCALE_NAMES, LOCALES, routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Voto Útil",
  robots: { index: false },
};

// Sin servidor no hay cabecera Accept-Language: se elige el idioma en el navegador
// a partir de sus preferencias y se redirige. Sin JavaScript, se ofrecen enlaces.
const script = `(function(){
  var supported=${JSON.stringify(LOCALES)};
  var prefs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]);
  var pick="${routing.defaultLocale}";
  for(var i=0;i<prefs.length;i++){var l=String(prefs[i]).toLowerCase().split("-")[0];if(supported.indexOf(l)>-1){pick=l;break;}}
  location.replace("/"+pick+location.search+location.hash);
})();`;

export default function RootRedirect() {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
        <noscript>
          <meta httpEquiv="refresh" content={`0; url=/${routing.defaultLocale}`} />
        </noscript>
      </head>
      <body className="grid min-h-svh place-items-center bg-background p-6 font-sans text-foreground">
        <nav aria-label="Idioma · Llengua · Hizkuntza · Lingua" className="flex flex-col items-center gap-4">
          <p className="text-2xl font-bold tracking-tight">Voto Útil</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {LOCALES.map((l) => (
              <li key={l}>
                <a href={`/${l}`} hrefLang={l} lang={l} className="underline underline-offset-4">
                  {LOCALE_NAMES[l]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </body>
    </html>
  );
}
