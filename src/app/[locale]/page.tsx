import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getEntries } from "@/lib/research";
import { alternates } from "@/lib/seo";
import { EntryList } from "@/components/ui/EntryList";
import { VaultForm } from "@/app/(private)/vault/VaultForm";
import { PixelEarth } from "@/components/ui/PixelEarth";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { alternates: alternates(locale, ""), openGraph: { title: t("siteName"), description: t("description"), locale, type: "website" } };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });
  const latest = (await getEntries(locale)).slice(0, 3);

  return (
    <>
      <section className="container hero">
        <div className="hero__planet" aria-hidden="true"><PixelEarth /></div>
        <p className="hero__kicker pixel pixel--s">{t("kicker")}</p>
        <h1 className="hero__title pixel pixel--l">{t("title")}</h1>
        <p className="hero__lede">{t("lede")}</p>
      </section>
      <section className="container section" aria-labelledby="latest">
        <div className="section__head">
          <h2 id="latest" className="pixel pixel--m">{t("latest")}</h2>
          <Link href="/library">{t("all")}</Link>
        </div>
        <EntryList entries={latest} locale={locale} />
      </section>
      <section className="container section" aria-labelledby="access">
        <h2 id="access" className="pixel pixel--m">{t("accessTitle")}</h2>
        <p className="hero__lede">{t("accessLead")}</p>
        <VaultForm />
      </section>
    </>
  );
}
