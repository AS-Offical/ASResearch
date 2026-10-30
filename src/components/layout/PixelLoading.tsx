const PIXELS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34, 35,
];

/** Shared pixel-build fallback for routes that are still rendering. */
export function PixelLoading() {
  return (
    <div className="pixel-loading" role="status" aria-label="Loading">
      <div className="pixel-loading__frame" aria-hidden="true">
        {PIXELS.map((pixel) => (
          <span key={pixel} style={{ animationDelay: `${((pixel * 11) % PIXELS.length) * 24}ms` }} />
        ))}
      </div>
      <span className="pixel-loading__label pixel pixel--s" aria-hidden="true">AS / RESEARCH</span>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
