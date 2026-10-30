import { LOGOS, type LogoName } from "./logo-data";

type Props = { name?: LogoName; title?: string; className?: string };

/** Inline outlined SVG; colour follows `currentColor` so it tracks the active theme. */
export function Logo({ name = "as-researches", title, className }: Props) {
  const logo = LOGOS[name];
  const [, , w, h] = logo.viewBox.split(" ").map(Number) as [number, number, number, number];
  return (
    <svg
      className={["logo", className].filter(Boolean).join(" ")}
      viewBox={logo.viewBox}
      style={{ aspectRatio: `${w} / ${h}` }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {logo.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
