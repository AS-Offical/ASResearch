import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Hero />;
}

function Hero() {
  const t = useTranslations("Home");
  return (
    <section className="container hero">
      <p className="hero__kicker pixel pixel--s">{t("kicker")}</p>
      <h1 className="hero__title pixel pixel--l">{t("title")}</h1>
      <p className="hero__lede">{t("lede")}</p>
    </section>
  );
}
