import { NextRequest, NextResponse } from "next/server"
import { locales, defaultLocale } from "./lib/i18n/config"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Exclude all of _next (static, image, and the dev webpack-hmr socket — a
  // narrower match was 307-redirecting /_next/webpack-hmr and breaking HMR)
  // and /ingest (the PostHog reverse proxy — a locale redirect would kill it).
  matcher: ["/((?!api|_next|ingest|favicon.ico|.*\\..*).*)"],
}
