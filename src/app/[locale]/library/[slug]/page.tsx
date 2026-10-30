import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { localeMeta, routing } from "@/i18n/routing";
import { formatDate, getAllSlugs, getAvailableLocales, getEntry } from "@/lib/research";
import { alternates, localeUrl, siteUrl } from "@/lib/seo";
import { Mdx } from "@/components/mdx";

export async function generateStaticParams() {
  const out: { locale: string; slug: string }[] = [];
  for (const slug of await getAllSlugs())
    for (const locale of await getAvailableLocales(slug)) out.push({ locale, slug });
  return out;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/library/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const entry = await getEntry(slug, locale);
  if (!entry) return { robots: { index: false, follow: true } }; // missing-translation notice page
  const path = `/library/${slug}`;
  const draft = entry.draft ? { robots: { index: false, follow: false } } : {};
  return {
    title: entry.title,
    description: entry.summary,
    alternates: alternates(locale, path, await getAvailableLocales(slug)),
    openGraph: { type: "article", title: entry.title, description: entry.summary, locale, url: localeUrl(locale, path), publishedTime: entry.date, tags: entry.tags },
    ...draft,
  };
}

export default async function ResearchPage({ params }: PageProps<"/[locale]/library/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Article" });
  const entry = await getEntry(slug, locale);

  if (!entry) {
    // Entry exists only in another language: say so clearly instead of showing mismatched content.
    const other = (await getAvailableLocales(slug))[0];
    if (!other) notFound();
    return (
      <section className="container container--reading">
        <p className="pixel pixel--s muted">{t("untranslatedKicker")}</p>
        <h1 className="pixel pixel--m">{t("untranslatedTitle")}</h1>
        <p>{t("untranslatedBody")}</p>
        <p>
          <Link href={`/library/${slug}`} locale={other} lang={other} hrefLang={other}>
            {t("openIn", { language: localeMeta[other].label })}
          </Link>
        </p>
        <p><Link href="/library">{t("backToLibrary")}</Link></p>
      </section>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.summary,
    datePublished: entry.date,
    inLanguage: locale,
    url: localeUrl(locale, `/library/${slug}`),
    publisher: { "@type": "Organization", name: "AS Research", url: siteUrl() },
  };

  return (
    <article className="container container--reading">
      <header className="entry-head">
        <p className="pixel pixel--s entry-head__id">{entry.id}</p>
        <h1 className="entry-head__title">{entry.title}</h1>
        {entry.summary ? <p className="entry-head__summary">{entry.summary}</p> : null}
        <p className="entry-head__meta muted">
          <span>{entry.category}</span>
          <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
          <span>{t("readingTime", { minutes: entry.readingMinutes })}</span>
        </p>
      </header>
      <div className="prose">
        <Mdx source={entry.body} />
      </div>
      <p className="entry-foot"><Link href="/library">{t("backToLibrary")}</Link></p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
