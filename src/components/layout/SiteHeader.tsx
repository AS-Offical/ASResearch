import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function SiteHeader({ localeSwitchHref }: { localeSwitchHref?: string } = {}) {
  const t = useTranslations();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__brand" aria-label={t("Nav.home")}>
          <Logo name="as-researches" />
        </Link>
        <nav className="site-header__tools" aria-label={t("Nav.primary")}>
          <Link href="/library" className="site-header__link">{t("Nav.library")}</Link>
          <LocaleSwitcher label={t("Locale.switchTo")} href={localeSwitchHref} />
          <ThemeToggle toLight={t("Theme.toLight")} toDark={t("Theme.toDark")} />
        </nav>
      </div>
    </header>
  );
}
