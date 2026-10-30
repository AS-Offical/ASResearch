import { getTranslations } from "next-intl/server";
import { Mdx } from "@/components/mdx";
import { Link } from "@/i18n/navigation";
import { localeMeta, type Locale } from "@/i18n/routing";
import type { PrivateResearch } from "@/lib/private/server";

/** Picks the viewer's language when present, otherwise the other one (and says so via lang/dir). */
export async function PrivateArticle({ research, locale }: { research: PrivateResearch; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Private" });
  if (research.kind !== "mdx") {
    return (
      <section className="container container--reading">
        <Link href="/" className="control article-home">{t("home")}</Link>
        <p className="pixel pixel--s muted">{t("kicker")}</p>
        <h1 className="pixel pixel--m">{t("bundleTitle")}</h1>
        <p>{t("bundleBody")}</p>
      </section>
    );
  }
  const order: Locale[] = locale === "ar" ? ["ar", "en"] : ["en", "ar"];
  const shown = order.find((l) => research[`content_${l}`]) ?? "en";
  const title = research[`title_${shown}`] ?? "";
  const summary = research[`summary_${shown}`];
  const body = research[`content_${shown}`] ?? "";
  return (
    <article className="container container--reading" lang={shown} dir={localeMeta[shown].dir}>
      <header className="entry-head">
        <Link href="/" className="control article-home">{t("home")}</Link>
        <p className="pixel pixel--s entry-head__id">{t("privateBadge")}</p>
        <h1 className="entry-head__title">{title}</h1>
        {summary ? <p className="entry-head__summary">{summary}</p> : null}
      </header>
      <div className="prose"><Mdx source={body} /></div>
    </article>
  );
}
