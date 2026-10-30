import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  // hreflang is emitted per page (Phase 2) only where a real translation exists.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

export const localeMeta: Record<Locale, { dir: "ltr" | "rtl"; label: string }> = {
  en: { dir: "ltr", label: "English" },
  ar: { dir: "rtl", label: "العربية" },
};
