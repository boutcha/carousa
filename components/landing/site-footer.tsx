import { isRtl, type Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { BrandMark } from "./brand-mark"
import { LocaleSwitcher } from "./locale-switcher"

export function SiteFooter({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <footer className="tarmac relative mt-auto overflow-hidden bg-asphalte text-signal">
      {/* extra bottom padding clears the fixed mobile CTA bar */}
      <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-14 sm:px-6 md:py-16">
        {/* The plate */}
        <div className="plate inline-flex items-center gap-4 bg-bitume px-5 py-3">
          <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
            {isRtl(locale) ? "كارسابلانكا" : "Carsablanca"}
          </span>
          <span className="h-7 w-[2px] bg-signal/30" aria-hidden="true" />
          <span className="font-mono text-sm font-bold text-signal/80">MA</span>
          <BrandMark />
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-2-dark">
          {dict.footer.disclaimer}
        </p>

        {/* Sources ledger — the audit chain resolves here */}
        <div id="sources" className="plate mt-8 max-w-3xl bg-bitume p-5">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-jaune">
            {dict.footer.sourcesTitle}
          </p>
          <ol className="mt-3 space-y-1.5">
            {dict.footer.sources.map((source, i) => (
              <li
                key={source}
                className="font-mono text-[11px] leading-relaxed text-signal/75"
              >
                [{i + 1}] {source}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-signal/15 pt-6 text-sm text-signal/70">
          <span>{dict.footer.rights}</span>
          <span className="font-mono text-xs">{dict.footer.madeIn}</span>
          <LocaleSwitcher current={locale} />
        </div>

        {/* Notarial closing on the centerline */}
        <div className="mt-8 flex items-center gap-4">
          <span
            className="inline-block size-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-rouge"
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
            {dict.footer.notarial}
          </span>
          <div className="centerline flex-1 opacity-20" aria-hidden="true" />
        </div>
      </div>
    </footer>
  )
}
