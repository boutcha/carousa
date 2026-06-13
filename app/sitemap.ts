import type { MetadataRoute } from "next"
import { locales } from "@/lib/i18n/config"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${SITE_URL}/${l}`])
  )

  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    changeFrequency: "weekly",
    priority: locale === "fr" ? 1 : 0.8,
    alternates: { languages },
  }))
}
