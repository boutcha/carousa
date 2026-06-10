export const locales = ["fr", "ar", "en"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "fr"

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar"
}

export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  ar: "عربية",
  en: "EN",
}
