import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

/** One uniform page for invalid, expired and revoked links: it never reveals which. */
export async function Unavailable({ locale, limited = false }: { locale: Locale; limited?: boolean }) {
  const t = await getTranslations({ locale, namespace: "Private" });
  return (
    <section className="container container--reading">
      <p className="pixel pixel--s muted">{t("kicker")}</p>
      <h1 className="pixel pixel--m">{limited ? t("limitedTitle") : t("unavailableTitle")}</h1>
      <p>{limited ? t("limitedBody") : t("unavailableBody")}</p>
    </section>
  );
}
