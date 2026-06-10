import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { LocaleSwitcher } from "./locale-switcher"

export function SiteFooter({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <p className="font-display text-2xl font-bold tracking-tight">
          carsablanca<span className="text-terracotta">.</span>
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background/60">
          {dict.footer.disclaimer}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-background/15 pt-6 text-sm text-background/70">
          <span>{dict.footer.rights}</span>
          <span className="font-mono text-xs">✦ {dict.footer.madeIn}</span>
          <LocaleSwitcher current={locale} onDark />
        </div>
      </div>
    </footer>
  )
}
