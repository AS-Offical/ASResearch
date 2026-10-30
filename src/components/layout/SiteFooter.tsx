import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="site-footer">
      <div className="container">{t("line")}</div>
    </footer>
  );
}
