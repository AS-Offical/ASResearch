const ICONS = {
  sun: ["....#....", ".#.....#.", "..#####..", "..#####..", "#.#####.#", "..#####..", "..#####..", ".#.....#.", "....#...."],
  moon: ["...####..", "..###....", ".###.....", ".###.....", ".###.....", ".###.....", "..###..#.", "...#####.", ".....###."],
} as const;

export type PixelIconName = keyof typeof ICONS;

/** Tiny bitmap icons drawn as SVG rects — decorative; the parent control supplies the accessible name. */
export function PixelIcon({ name }: { name: PixelIconName }) {
  const rows = ICONS[name];
  return (
    <svg className="pixel-icon" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
    </svg>
  );
}
