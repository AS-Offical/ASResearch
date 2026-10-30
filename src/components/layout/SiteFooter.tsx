import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span>{t("line")}</span>
        <span className="site-footer__contact">
          {t("contact")}
          <a href="mailto:ResearchesMadeByAS@gmail.com">ResearchesMadeByAS@gmail.com</a>
        </span>
      </div>
    </footer>
  );
}
