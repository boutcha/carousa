import Link from "next/link"
import { cn } from "@/lib/utils"
import { localeLabels, locales, type Locale } from "@/lib/i18n/config"

export function LocaleSwitcher({
  current,
  onDark = false,
}: {
  current: Locale
  onDark?: boolean
}) {
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}`}
          aria-current={locale === current ? "page" : undefined}
          className={cn(
            "rounded-sm px-1.5 py-1 transition-colors",
            locale === current
              ? onDark
                ? "bg-background text-foreground"
                : "bg-foreground text-background"
              : onDark
                ? "text-background/60 hover:text-background"
                : "text-foreground/60 hover:text-foreground"
          )}
        >
          {localeLabels[locale]}
        </Link>
      ))}
    </div>
  )
}
