import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { PageTransition } from "@/components/layout/PageTransition";
import { localeMeta } from "@/i18n/routing";
import { getPrivateLocale } from "@/lib/private/server";
import "@/styles/index.css";

// Every private route: never indexed, never cached, never referred.
export const metadata: Metadata = {
  title: { default: "AS Researches", template: "%s | AS Researches" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const locale = await getPrivateLocale();
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return (
    <html lang={locale} dir={localeMeta[locale].dir} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader localeSwitchHref="/" />
          <main id="main"><PageTransition>{children}</PageTransition></main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
