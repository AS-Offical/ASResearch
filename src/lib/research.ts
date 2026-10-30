import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { routing, type Locale } from "@/i18n/routing";

const DIR = path.join(process.cwd(), "content", "research");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Drafts (sample/unfinished entries) are visible only in dev or when SHOW_DRAFTS=1. */
const showDrafts = () => process.env.NODE_ENV !== "production" || process.env.SHOW_DRAFTS === "1";

export type Entry = {
  slug: string;
  locale: Locale;
  id: string;
  title: string;
  summary?: string;
  category: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  draft: boolean;
  readingMinutes: number;
  body: string;
};

export const isValidSlug = (s: string) => SLUG_RE.test(s);

function parse(slug: string, locale: Locale, raw: string): Entry {
  const { data, content } = matter(raw);
  const need = (k: string) => {
    if (typeof data[k] !== "string" || !data[k]) throw new Error(`research/${slug}/${locale}.mdx: frontmatter "${k}" is required`);
    return data[k] as string;
  };
  const date = need("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`research/${slug}/${locale}.mdx: date must be YYYY-MM-DD`);
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    locale,
    id: need("id"),
    title: need("title"),
    summary: typeof data.summary === "string" ? data.summary : undefined,
    category: need("category"),
    date,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: data.draft === true,
    readingMinutes: Math.max(1, Math.round(words / (locale === "ar" ? 180 : 220))),
    body: content,
  };
}

async function read(slug: string, locale: Locale): Promise<Entry | null> {
  if (!isValidSlug(slug)) return null;
  try {
    const entry = parse(slug, locale, await fs.readFile(path.join(DIR, slug, `${locale}.mdx`), "utf8"));
    return entry.draft && !showDrafts() ? null : entry;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

export const getEntry = read;

async function slugs(): Promise<string[]> {
  try {
    const dirs = await fs.readdir(DIR, { withFileTypes: true });
    return dirs.filter((d) => d.isDirectory() && isValidSlug(d.name)).map((d) => d.name);
  } catch {
    return [];
  }
}

/** Entries that exist in this locale, newest first. */
export async function getEntries(locale: Locale): Promise<Entry[]> {
  const all = await Promise.all((await slugs()).map((s) => read(s, locale)));
  return all.filter((e): e is Entry => e !== null).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** Which locales actually have a translation of this entry (drives hreflang and the switcher). */
export async function getAvailableLocales(slug: string): Promise<Locale[]> {
  const found = await Promise.all(routing.locales.map(async (l) => ((await read(slug, l)) ? l : null)));
  return found.filter((l): l is Locale => l !== null);
}

export async function getAllSlugs(): Promise<string[]> {
  const out: string[] = [];
  for (const s of await slugs()) if ((await getAvailableLocales(s)).length) out.push(s);
  return out;
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
