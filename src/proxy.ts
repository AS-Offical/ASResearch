import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Only public, locale-prefixed pages are handled here. Private routes (/vault, /v/*)
// are intentionally excluded and arrive in Phase 3.
export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(en|ar)/:path*"],
};
