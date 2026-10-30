// WCAG 2.x contrast for the token pairs in src/styles/tokens.css, both themes.
const themes = {
  dark: { bg: "#121413", surface: "#1a1d1b", border: "#2c312e", "border-strong": "#6b726d", text: "#d9dcd8", muted: "#9aa09b", accent: "#3ddc84", "on-accent": "#121413" },
  light: { bg: "#f2f3f0", surface: "#ffffff", border: "#d5d8d3", "border-strong": "#7a817c", text: "#1a1d1b", muted: "#5b625d", accent: "#0f6b3e", "on-accent": "#ffffff" },
};
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// [fg, bg, minimum, note]
const pairs = [
  ["text", "bg", 4.5], ["text", "surface", 4.5], ["muted", "bg", 4.5], ["muted", "surface", 4.5],
  ["accent", "bg", 4.5], ["accent", "surface", 4.5], ["on-accent", "accent", 4.5],
  ["border-strong", "bg", 3], ["border-strong", "surface", 3], ["accent", "bg", 3, "focus ring"],
  ["border", "bg", 1, "decorative divider (no minimum)"],
];
let fail = 0;
for (const [t, set] of Object.entries(themes)) for (const [f, b, min, note] of pairs) {
  const r = ratio(set[f], set[b]); const ok = r >= min; if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${t.padEnd(5)} ${f} on ${b}: ${r.toFixed(2)} (min ${min})${note ? " — " + note : ""}`);
}
// the guide's own cautionary example
console.log(`info  #12804a on #f2f3f0: ${ratio("#12804a", "#f2f3f0").toFixed(2)} (guide: 4.48, rejected)`);
process.exit(fail ? 1 : 0);
