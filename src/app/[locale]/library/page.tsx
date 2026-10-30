import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getEntries } from "@/lib/research";
import { alternates } from "@/lib/seo";
import { EntryList } from "@/components/ui/EntryList";

export async function generateMetadata({ params }: PageProps<"/[locale]/library">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Library" });
  return { title: t("title"), description: t("description"), alternates: alternates(locale, "/library"), openGraph: { title: t("title"), description: t("description"), locale, type: "website" } };
}

export default async function LibraryPage({ params }: PageProps<"/[locale]/library">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Library" });
  const entries = await getEntries(locale);
  return (
    <section className="container">
      <p className="pixel pixel--s muted">{t("count", { count: entries.length })}</p>
      <h1 className="pixel pixel--l">{t("title")}</h1>
      <p className="hero__lede section__lede">{t("description")}</p>
      <EntryList entries={entries} locale={locale} />
    </section>
  );
}
