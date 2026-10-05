import { LOCALE_NAMES, LOCALES } from "@/i18n/routing";

export default function RootNotFound() {
  return (
    <html lang="es">
      <body className="grid min-h-svh place-items-center bg-background p-6 font-sans text-foreground">
        <main className="flex max-w-md flex-col items-center gap-4 text-center">
          <p className="kicker">404</p>
          <h1 className="text-2xl font-bold tracking-tight">Página no encontrada</h1>
          <ul className="flex flex-wrap justify-center gap-3">
            {LOCALES.map((l) => (
              <li key={l}>
                <a href={`/${l}`} hrefLang={l} lang={l} className="underline underline-offset-4">
                  {LOCALE_NAMES[l]}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
