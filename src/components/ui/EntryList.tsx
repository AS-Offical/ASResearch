import { getTranslations } from "next-intl/server";
import { formatDate, type Entry } from "@/lib/research";
import { IndexRow } from "./IndexRow";

export async function EntryList({ entries, locale }: { entries: Entry[]; locale: "en" | "ar" }) {
  const t = await getTranslations({ locale, namespace: "Library" });
  if (!entries.length) return <p className="muted">{t("empty")}</p>;
  return (
    <ul className="index">
      {entries.map((e) => (
        <IndexRow
          key={e.slug}
          href={`/library/${e.slug}`}
          id={e.id}
          title={e.title}
          category={e.category}
          date={formatDate(e.date, locale)}
          draft={e.draft ? t("draft") : undefined}
        />
      ))}
    </ul>
  );
}
