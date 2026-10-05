# Voto Útil

Dos herramientas independientes para las elecciones generales:

- **Simulador de escaños**: aplica el reparto D'Hondt de la LOREG a los resultados oficiales del Congreso de 2023 (52 circunscripciones, 350 escaños) y permite modificar votos para explorar escenarios.
- **Comparador de programas**: compara medidas por temas con cita literal, página, enlace y un índice de concreción de cinco criterios.

No recomienda a quién votar, no tiene cuentas, no usa cookies ni analítica y no envía nada a ningún servidor: todos los cálculos se hacen en el navegador.

Disponible en castellano, catalán, euskera y gallego (`/es`, `/ca`, `/eu`, `/gl`).

## Stack

- Next.js 16 (App Router) con `output: "export"`: el resultado es HTML estático.
- React 19 con React Compiler.
- Tailwind CSS 4 y componentes shadcn/ui (Radix).
- next-intl para la internacionalización y next-themes para el tema claro/oscuro.
- Vitest para las pruebas unitarias y de datos; Playwright para las pruebas de interfaz.

## Requisitos

- Node.js 20.9 o superior.
- npm. El proyecto incluye un `.npmrc` que fija el registro público de npm.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:3000`. |
| `npm run build` | Exporta el sitio estático a `out/`. |
| `npm start` | Sirve `out/` en local (requiere haber hecho `build`). |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Comprobación de tipos con TypeScript. |
| `npm test` | Pruebas unitarias y de datos (Vitest). |
| `npm run test:e2e` | Pruebas de interfaz (Playwright) contra el sitio exportado. La primera vez: `npx playwright install chromium`. |
| `npm run check` | Lint, tipos, pruebas unitarias y build. |
| `npm run data:import` | Regenera los datos electorales desde Infoelectoral. |
| `npm run data:iconos` | Descarga de nuevo los favicons de los partidos. |

## Datos electorales

Los resultados están en `src/data/elecciones/congreso-2023-07/`:

- `circunscripciones.json`: censo, votos en blanco, nulos y votos y escaños oficiales de cada candidatura en cada circunscripción.
- `manifest.json`: fuente, URL del fichero original, fecha de descarga, SHA-256, formato y condiciones de reutilización.
- `grupos.json`: agrupa las candidaturas por su cabecera nacional y asigna un color orientativo. Los colores siempre se muestran acompañados de las siglas.

Para regenerarlos:

```bash
npm run data:import                     # descarga 02202307_TOTA.zip del Ministerio del Interior
npm run data:import -- --zip ruta.zip   # usa un ZIP ya descargado
```

El script lee los ficheros de registro fijo 03 (candidaturas), 07 (datos por circunscripción) y 08 (votos y escaños por candidatura) y comprueba que salgan 52 circunscripciones, 350 escaños y que las sumas de votos cuadren. El ZIP se guarda en `data-raw/`, que no se versiona.

Las pruebas de `tests/unit/datos-electorales.test.ts` verifican que el motor reproduce el reparto oficial en todas las circunscripciones y la composición final del Congreso.

### Reglas que aplica el motor (`src/domain/dhondt.ts`)

- Barrera del 3 % sobre los votos válidos de la circunscripción (candidaturas más blanco). Los nulos no cuentan.
- Reparto D'Hondt con comparación exacta de cocientes, sin redondeos.
- Empates: gana la candidatura con más votos totales; si también empatan en votos, se señala que la ley prevé un sorteo en lugar de resolverlo.
- Ceuta y Melilla: un escaño para la candidatura más votada, sin barrera.

## Iconos de los partidos

Cada candidatura muestra el favicon de la web oficial de su partido junto a las siglas.

- `src/data/partidos/webs.json`: web oficial de cada partido (comprobada a mano) y su código de cabecera nacional en cada elección. Las federaciones y coaliciones usan el icono de su cabecera, igual que el color.
- `src/data/partidos/iconos.json`: generado; origen, fecha, tamaño y SHA-256 de cada fichero.
- `public/partidos/`: los ficheros, sin modificar. Se sirven desde el propio sitio, así que no hay peticiones a terceros.

Para actualizarlos: `npm run data:iconos`. El script descarta los SVG y cualquier respuesta que no sea una imagen. Si una web bloquea la descarga, se puede fijar la URL del icono con `icono` y explicarlo en `notaIcono` (es el caso de VOX). Los partidos sin web verificable o sin icono propio se muestran solo con sus siglas.

Los iconos son propiedad de cada partido y se usan solo para identificarlo.

## Programas electorales

Los datos están en `src/data/programas/`. **Ahora mismo son datos de ejemplo**: las medidas son ilustrativas, no proceden de ningún programa oficial y se muestran marcadas como «Ejemplo» y «Pendiente de fuente». La web lo avisa en el comparador y en la portada.

Cada medida real debe incluir:

- la cita literal en el idioma original del programa y la página;
- los cinco criterios del índice de concreción (diagnóstico, mecanismo, financiación, calendario e indicador);
- el estado de revisión, quién la revisó y en qué fecha.

Cada partido incluye además la URL del programa, su fecha de publicación y la fecha de consulta. Si un dato no tiene fuente, no se rellena: se muestra como pendiente.

## Internacionalización

- Los textos están en `src/messages/{es,ca,eu,gl}.json`. Una prueba comprueba que los cuatro idiomas tienen las mismas claves y las mismas variables.
- La raíz `/` elige idioma en el navegador según `navigator.languages`, sin cookies; si el idioma no está disponible, va a `/es`.
- Cambiar de idioma conserva la página y el escenario del simulador.
- Las citas de los programas se muestran siempre en su idioma original.

Las traducciones al catalán, euskera y gallego necesitan la revisión de hablantes nativos antes de publicar.

## Despliegue en Vercel (plan Hobby)

1. Importa el repositorio en Vercel. Detecta Next.js y, al ser una exportación estática, publica `out/` sin funciones de servidor.
2. Opcional: define `NEXT_PUBLIC_REPO_URL` (por ejemplo, `https://github.com/dcampina/voto-util`) para mostrar el enlace al código en el pie de página. Si no se define, el enlace no aparece.

El sitio no necesita base de datos, variables secretas ni servicios externos.

## Privacidad

- Sin cookies, sin analítica, sin cuentas y sin peticiones a terceros. Hay una prueba de Playwright que lo comprueba.
- El escenario del simulador solo vive en la URL para poder compartirlo.
- El tema elegido (claro, oscuro o sistema) se guarda en el `localStorage` del navegador. Nunca sale del dispositivo.

## Estructura

```
scripts/                 Importador de Infoelectoral
src/app/[locale]/        Páginas: portada, simulador, programas, metodología
src/components/          Interfaz (simulador, comparador, gráficos, shell)
src/components/ui/       Componentes shadcn/ui
src/data/                Resultados electorales y programas
src/domain/              Lógica pura: D'Hondt, escenarios, índice de concreción
src/i18n/                Configuración de next-intl
src/messages/            Traducciones
tests/unit/              Vitest
tests/e2e/               Playwright
```

## Fuentes

- Resultados: Ministerio del Interior, [Infoelectoral](https://infoelectoral.interior.gob.es/).
- Normativa: [Ley Orgánica 5/1985, del Régimen Electoral General](https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672).
