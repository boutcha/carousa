import Link from "next/link"
import { cn } from "@/lib/utils"
import { localeLabels, locales, type Locale } from "@/lib/i18n/config"

/* Plate tabs — like the stacked region plates on a Moroccan registration */
export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px]">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}`}
          aria-current={locale === current ? "page" : undefined}
          className={cn(
            "border px-2 py-1 leading-none transition-colors",
            locale === current
              ? "border-signal bg-signal text-asphalte"
              : "border-signal/25 text-signal/60 hover:border-signal/60 hover:text-signal"
          )}
        >
          {localeLabels[locale]}
        </Link>
      ))}
    </div>
  )
}
