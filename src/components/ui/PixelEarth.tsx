type Span = readonly [number, number, number];

// Pixel rows: [y, first x, last x]. The intentionally simplified continents
// keep the silhouette readable at the large, decorative scale used in the hero.
const landSpans: readonly Span[] = [
  [1, 8, 10], [2, 7, 11], [3, 5, 12], [4, 4, 12], [5, 3, 12], [6, 3, 11],
  [7, 4, 11], [8, 5, 10], [9, 7, 10], [10, 9, 12], [11, 10, 13],
  [12, 11, 14], [13, 11, 14], [14, 12, 14], [15, 12, 14], [16, 13, 14],
  [17, 13, 14], [18, 12, 14], [19, 12, 13], [20, 12, 13], [21, 12, 12],
  [6, 2, 2], [7, 3, 3], [8, 4, 4], [10, 8, 8], [11, 9, 9], [12, 10, 10],
  [14, 15, 16], [15, 15, 16], [16, 15, 15], [18, 11, 11], [19, 11, 11],
  [4, 3, 3], [5, 2, 2], [6, 1, 1], [8, 3, 3], [9, 4, 5], [10, 6, 7],
  [11, 8, 8], [12, 9, 9], [13, 10, 10], [14, 11, 11], [15, 11, 11],
  // Northern green land fills the marked gap above the existing continents.
  [3, 13, 17], [4, 13, 18], [5, 13, 18], [6, 14, 18], [7, 15, 18],
  [3, 16, 23], [4, 15, 24], [5, 15, 24], [6, 15, 23], [7, 16, 22],
  [8, 17, 21], [9, 17, 20], [10, 17, 19], [11, 18, 20], [12, 19, 20],
  [2, 18, 21], [5, 25, 26], [6, 24, 25], [7, 23, 24],
  [4, 25, 26], [5, 27, 27], [6, 26, 26], [7, 25, 25], [8, 22, 23],
  [9, 21, 22], [10, 20, 21], [11, 21, 22], [12, 21, 21],
  [8, 12, 16], [9, 12, 17], [10, 12, 17], [11, 13, 16], [12, 13, 16],
  [13, 13, 15], [14, 13, 15], [15, 14, 15], [16, 14, 14],
  [12, 17, 18], [13, 16, 17], [14, 16, 17],
  [15, 16, 16], [16, 15, 15], [17, 15, 15], [18, 14, 14], [19, 13, 13],
  [18, 20, 23], [19, 20, 24], [20, 21, 23], [21, 22, 23], [22, 22, 22], [2, 8, 10],
];

const OCEAN = ["#235d94", "#24679f", "#2875ad", "#2e82b7"] as const;
const GLOW = ["#091629", "#0b1d35", "#0f2948", "#14385f", "#1a4a78", "#205a8b"] as const;
const LAND = ["#4b7f43", "#598e4c", "#67994f", "#7ea75a"] as const;
const DESERT = "#c3a765";
const ICE = "#cbd9d0";
const CLOUD = "#d7e5e1";
const STARS = [
  [45, 10, 360], [47, 23, 120], [44, 38, 300], [7, 42, 420], [1, 28, 180],
  [2, 15, 0], [46, 30, 480], [4, 36, 360],
] as const;

function paintEarth() {
  const tiles: { x: number; y: number; fill: string; glow: boolean; opacity?: number }[] = [];
  const center = 24;
  const radius = 15.5;
  const haloEdge = 21.2;

  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const distance = Math.hypot(x + 0.5 - center, y + 0.5 - center);
      if (distance > radius && distance < haloEdge) {
        const fade = 1 - (distance - radius) / (haloEdge - radius);
        const step = Math.min(GLOW.length - 1, Math.floor(fade * GLOW.length));
        tiles.push({ x, y, fill: GLOW[step]!, glow: true, opacity: Number((fade * 0.78).toFixed(2)) });
        continue;
      }
      if (distance > radius) continue;

      const localX = x - 10;
      const localY = y - 10;
      const isLand = landSpans.some(([row, start, end]) => row === localY && localX >= start && localX <= end);
      const isDesert = isLand && localY >= 10 && localY <= 14 && localX >= 12 && localX <= 16;
      const isIce = isLand && localY <= 2;
      const isCloud = !isLand && ((localY === 6 && localX >= 17 && localX <= 19) ||
        (localY === 13 && localX >= 4 && localX <= 6) || (localY === 17 && localX >= 19 && localX <= 21));
      const variation = (x * 7 + y * 11) % 4;
      const fill = isIce ? ICE : isDesert ? DESERT : isCloud ? CLOUD : isLand ? LAND[variation]! : OCEAN[variation]!;
      tiles.push({ x, y, fill, glow: false });
    }
  }

  return tiles;
}

const EARTH_TILES = paintEarth();

/** Decorative pixel-art earth with a stepped blue halo, no blur or soft glow. */
export function PixelEarth() {
  return (
    <svg className="pixel-earth" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {STARS.map(([x, y, delay], index) => (
        <rect key={`star-${index}`} className="pixel-earth__star" x={x} y={y} width="1" height="1" style={{ animationDelay: `${delay}ms` }} />
      ))}
      {EARTH_TILES.map(({ x, y, fill, glow, opacity }) => (
        <rect key={`${x}-${y}`} className={glow ? "pixel-earth__halo" : undefined} x={x} y={y} width="1" height="1" fill={fill} opacity={opacity} />
      ))}
    </svg>
  );
}
