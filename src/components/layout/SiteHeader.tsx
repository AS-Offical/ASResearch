import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function SiteHeader() {
  const t = useTranslations();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__brand" aria-label={t("Nav.home")}>
          <Logo name="as-researches" />
        </Link>
        <div className="site-header__tools" role="group" aria-label={t("Nav.primary")}>
          <LocaleSwitcher label={t("Locale.switchTo")} />
          <ThemeToggle toLight={t("Theme.toLight")} toDark={t("Theme.toDark")} />
        </div>
      </div>
    </header>
  );
}
