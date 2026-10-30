import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { preload } from "react-dom";
import { localeMeta, routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ThemeScript } from "@/components/layout/ThemeScript";
import "@/styles/index.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: { default: t("siteName"), template: `%s — ${t("siteName")}` },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Critical fonts only (above the fold): pixel display + the locale's text face.
  const font = (href: string) => preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  font("/fonts/pixel-ae/PixelAE-Bold.woff2");
  font(locale === "ar" ? "/fonts/cairo/Cairo-arabic-wght.woff2" : "/fonts/montserrat/Montserrat-latin-wght.woff2");

  const t = await getTranslations({ locale, namespace: "A11y" });

  return (
    <html lang={locale} dir={localeMeta[locale].dir} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider>
          <a href="#main" className="skip-link">
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
