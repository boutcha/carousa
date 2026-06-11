import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { BrandMark } from "./brand-mark"
import { LocaleSwitcher } from "./locale-switcher"

export function SiteHeader({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-signal/12 bg-asphalte/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 font-display text-xl font-extrabold uppercase tracking-wide text-signal"
        >
          <BrandMark />
          Carsablanca
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-signal/65 md:flex">
          <a href="#cars" className="transition-colors hover:text-signal">
            {dict.header.how}
          </a>
          <a href="#costs" className="transition-colors hover:text-signal">
            {dict.header.costs}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <LocaleSwitcher current={locale} />
          <Link
            href={`/${locale}/trouver`}
            className="hidden items-center border border-rouge bg-rouge px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-signal transition-transform hover:bg-rouge/90 active:translate-y-px sm:inline-flex"
          >
            {dict.header.cta}
          </Link>
        </div>
      </div>
    </header>
  )
}
