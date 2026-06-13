"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import type { Locale } from "@/lib/i18n/config"

let initialized = false

/* PostHog behind a first-party /ingest proxy (see next.config.ts rewrites).
   No-ops without NEXT_PUBLIC_POSTHOG_KEY, so dev and previews stay silent.
   The `defaults` preset captures SPA pageviews on history changes itself. */
export function AnalyticsProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    if (!initialized) {
      initialized = true
      posthog.init(key, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://eu.posthog.com",
        defaults: "2025-05-24",
      })
    }
    posthog.register({ locale })
  }, [locale])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
