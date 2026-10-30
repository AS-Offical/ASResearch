import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <section className="container container--reading">
      <p className="pixel pixel--s muted">404</p>
      <h1 className="pixel pixel--m">{t("title")}</h1>
      <p>{t("body")}</p>
      <Link href="/">{t("home")}</Link>
    </section>
  );
}
