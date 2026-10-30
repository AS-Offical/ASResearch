# Font sources (self-hosted, no runtime CDN)

| Family | Files | Source | Version |
|---|---|---|---|
| Pixel AE (Ahmed Essam) 400/700 | pixel-ae/PixelAE-{Regular,Bold}.woff2 | Resources/fonts/Pixel-AE/*.ttf, converted unmodified (no subsetting) | 1.000 |
| Pixelify Sans 400/700 (latin) | pixelify-sans/PixelifySans-{Regular,Bold}.woff2 | Google Fonts files via npm `@fontsource/pixelify-sans` | 5.3.0 (Google v3) |
| Montserrat variable wght (latin) | montserrat/Montserrat-latin-wght.woff2 | `@fontsource-variable/montserrat` | 5.3.0 |
| Cairo variable wght (arabic, latin) | cairo/Cairo-*-wght.woff2 | `@fontsource-variable/cairo` | 5.3.0 |

Fonts.googleapis.com / gstatic were unreachable from the build sandbox, so the same Google Fonts WOFF2 files were taken from the @fontsource npm mirror.
Re-verify against fonts.google.com when network allows. Pixelify subsets used do not contain U+2264/2265/2260 (≤ ≥ ≠); № is only in the Cyrillic subset.
Rebuild Pixel AE WOFF2 and logos: `npm run assets:build -- <ibm-plex-mono-latin-400.woff2>`.
