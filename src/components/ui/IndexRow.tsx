import { Link } from "@/i18n/navigation";

type Props = { href: string; id: string; title: string; category: string; date: string; draft?: string };

/** One row of the library index: id, title, category, date. Not a card. */
export function IndexRow({ href, id, title, category, date, draft }: Props) {
  return (
    <li className="index__row">
      <Link href={href} className="index__link">
        <span className="index__id pixel pixel--s">{id}</span>
        <span className="index__title">{title}</span>
        <span className="index__meta">
          <span>{category}</span>
          {draft ? <span className="badge">{draft}</span> : null}
          <time>{date}</time>
        </span>
      </Link>
    </li>
  );
}
