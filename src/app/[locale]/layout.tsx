import type { Metadata } from "next";
import { Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HtmlLang } from "@/components/html-lang";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { asLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("siteName"), template: `%s · ${t("siteName")}` },
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={cn(sans.variable, mono.variable)}>
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <NextIntlClientProvider>
            <TooltipProvider delayDuration={200}>
              <HtmlLang />
              <SiteHeader />
              <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <SiteFooter />
              <Toaster position="bottom-center" />
            </TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
