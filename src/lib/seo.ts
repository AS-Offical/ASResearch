import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Locale-prefixed absolute URL. `path` starts with "/" or is "" for the locale root. */
export const localeUrl = (locale: Locale, path = "") => `${siteUrl()}/${locale}${path === "/" ? "" : path}`;

/** canonical + hreflang. Languages are only listed where a real translation exists. */
export function alternates(locale: Locale, path: string, available: readonly Locale[] = routing.locales): Metadata["alternates"] {
  return {
    canonical: localeUrl(locale, path),
    languages: available.length > 1 ? Object.fromEntries(available.map((l) => [l, localeUrl(l, path)])) : undefined,
  };
}
