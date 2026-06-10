import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { ReceiptCard } from "./receipt-card"

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.hero

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-zellige [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
        <div className="min-w-0">
          <p className="anim-rise font-mono text-xs uppercase tracking-[0.2em] text-terracotta-deep">
            {t.kicker}
          </p>
          <h1 className="anim-rise mt-5 text-balance font-display text-5xl font-semibold leading-[1.06] tracking-tight [animation-delay:.08s] sm:text-6xl lg:text-[3.65rem]">
            {t.h1a && <>{t.h1a} </>}
            <em className="italic text-primary">{t.h1accent}</em>
            {t.h1b && <> {t.h1b}</>}
            <span className="block">{t.h1line2}</span>
          </h1>
          <p className="anim-rise mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground [animation-delay:.16s]">
            {t.sub}
          </p>

          <form
            action={`/${locale}/trouver`}
            className="anim-rise mt-9 max-w-md [animation-delay:.24s]"
          >
            <label
              htmlFor="budget"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              {t.budgetLabel}
            </label>
            <div className="mt-2 flex items-stretch overflow-hidden rounded-lg border-2 border-foreground bg-card shadow-warm transition-shadow focus-within:ring-2 focus-within:ring-primary/40">
              <input
                id="budget"
                name="budget"
                inputMode="numeric"
                placeholder={t.budgetPlaceholder}
                dir="ltr"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-mono text-lg outline-none placeholder:text-muted-foreground/50"
              />
              <span className="self-center pe-3 font-mono text-sm text-muted-foreground">
                {t.budgetUnit}
              </span>
              <button
                type="submit"
                className="bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t.cta}
              </button>
            </div>
            <p className="mt-2.5 font-mono text-xs text-muted-foreground">
              {t.ctaHint}
            </p>
          </form>
        </div>

        <ReceiptCard dict={dict} />
      </div>
    </section>
  )
}
