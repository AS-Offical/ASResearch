import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { localeMeta } from "@/i18n/routing";
import { getPrivateLocale } from "@/lib/private/server";
import "@/styles/index.css";

// Every private route: never indexed, never cached, never referred.
export const metadata: Metadata = {
  title: { default: "AS Research", template: "%s — AS Research" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const locale = await getPrivateLocale();
  const t = await getTranslations({ locale, namespace: "Theme" });
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return (
    <html lang={locale} dir={localeMeta[locale].dir} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="site-header">
            <div className="container site-header__inner">
              <span className="site-header__brand"><Logo name="as-researches" title="AS Research" /></span>
              <nav className="site-header__tools"><ThemeToggle toLight={t("toLight")} toDark={t("toDark")} /></nav>
            </div>
          </header>
          <main id="main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
