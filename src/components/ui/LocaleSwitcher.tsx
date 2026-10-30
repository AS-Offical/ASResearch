"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeMeta, routing, type Locale } from "@/i18n/routing";

/** A real link (works without JS) to the same path in the other locale. */
export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <Link
      href={pathname}
      locale={other}
      hrefLang={other}
      lang={other}
      className="control"
      aria-label={label}
    >
      {localeMeta[other].label}
    </Link>
  );
}
