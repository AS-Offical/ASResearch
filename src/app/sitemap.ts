import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllSlugs, getAvailableLocales, getEntry } from "@/lib/research";
import { localeUrl } from "@/lib/seo";

// Public, indexable pages only. Drafts are filtered out by getEntry in production.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const langs = (path: string, locales: readonly string[]) =>
    locales.length > 1 ? { languages: Object.fromEntries(locales.map((l) => [l, localeUrl(l as "en" | "ar", path)])) } : undefined;
  const out: MetadataRoute.Sitemap = [];
  for (const path of ["", "/library"])
    for (const l of routing.locales) out.push({ url: localeUrl(l, path), alternates: langs(path, routing.locales) });
  for (const slug of await getAllSlugs()) {
    const locales = await getAvailableLocales(slug);
    for (const l of locales) {
      const e = await getEntry(slug, l);
      if (e && !e.draft) out.push({ url: localeUrl(l, `/library/${slug}`), lastModified: e.date, alternates: langs(`/library/${slug}`, locales) });
    }
  }
  return out;
}
