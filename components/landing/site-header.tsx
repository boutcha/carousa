import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { LocaleSwitcher } from "./locale-switcher"

export function SiteHeader({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href={`/${locale}`}
          className="font-display text-[1.35rem] font-bold tracking-tight"
        >
          carsablanca<span className="text-terracotta-deep">.</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/70 md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">
            {dict.header.how}
          </a>
          <a href="#costs" className="transition-colors hover:text-foreground">
            {dict.header.costs}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <LocaleSwitcher current={locale} />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={`/${locale}/trouver`}>{dict.header.cta}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
