import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { CostExplosion } from "./cost-explosion"
import { DataRoad } from "./data-road"

/* Mobile order: the claim, then the proof (the price explodes — no brand,
   just the lesson), then the ask. On lg the proof is the right column. */
export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.hero

  return (
    <section className="tarmac relative overflow-hidden bg-asphalte">
      {/* Ambient night-road backdrop (canvas; static under reduced-motion) */}
      <DataRoad className="pointer-events-none absolute inset-0 z-0 h-full w-full" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-y-8 px-4 pb-24 pt-9 sm:px-6 lg:grid-cols-[6.5fr_5.5fr] lg:items-center lg:gap-x-14 lg:gap-y-7 lg:pb-32 lg:pt-20">
        {/* 1 — the claim */}
        <div className="min-w-0">
          <p className="rise font-mono text-[11px] uppercase tracking-[0.18em] text-jaune sm:tracking-[0.28em]">
            {t.kicker}
          </p>
          <h1 className="rise mt-5 font-display font-bold uppercase leading-[0.95] tracking-tight text-signal [animation-delay:.08s] lg:mt-6 rtl:leading-[1.22] rtl:tracking-normal">
            <span className="block text-[clamp(2.55rem,10.5vw,5.1rem)] rtl:text-[clamp(2.1rem,8.5vw,4.2rem)]">
              {t.h1l1}
            </span>
            <span className="block text-[clamp(2.55rem,10.5vw,5.1rem)] rtl:text-[clamp(2.1rem,8.5vw,4.2rem)]">
              {t.h1l2}
            </span>
            <span className="hatch-underline mt-1 inline-block text-[clamp(2.55rem,10.5vw,5.1rem)] rtl:text-[clamp(2.1rem,8.5vw,4.2rem)]">
              {t.h1l3}
            </span>
          </h1>
        </div>

        {/* 2 — the proof: an anonymous sticker price explodes into the six
            real monthly costs. No brand, no model — just the lesson. */}
        <div className="relative mx-auto w-full min-w-0 max-w-[480px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:max-w-none">
          <CostExplosion
            eager
            segments={dict.instrument.segments}
            price={dict.showcase.price}
            priceUnit={dict.showcase.priceUnit}
            priceLabel={dict.selection.priceLabel}
            total={dict.ledger.total}
            totalUnit={dict.ledger.totalUnit}
            trueLabel={dict.selection.trueLabel}
            legendContract={dict.instrument.legendContract}
            legendEstimate={dict.instrument.legendEstimate}
            replayHint={dict.ledger.replay}
            stamp={t.stamp}
          />
        </div>

        {/* 3 — the ask */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <p className="rise max-w-xl text-base leading-relaxed text-ink-2-dark [animation-delay:.16s] sm:text-lg">
            {t.sub}
          </p>

          {/* Le Guichet — budget input as an embossed plate */}
          <form
            action={`/${locale}/trouver`}
            className="rise mt-7 max-w-md [animation-delay:.24s] lg:mt-10"
          >
            <label
              htmlFor="budget"
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2-dark"
            >
              {t.budgetLabel}
            </label>
            <div className="plate mt-2.5 flex items-stretch bg-signal">
              <input
                id="budget"
                name="budget"
                inputMode="numeric"
                placeholder={t.budgetPlaceholder}
                dir="ltr"
                className="min-w-0 flex-1 bg-transparent px-4 py-4 font-mono text-2xl font-bold text-asphalte outline-none placeholder:text-asphalte/30"
              />
              <span
                className="my-2 w-[2px] bg-asphalte/80"
                aria-hidden="true"
              />
              <span className="flex items-center px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-asphalte">
                {t.budgetUnit}
              </span>
            </div>
            <button
              type="submit"
              className="mt-3 w-full border border-rouge bg-rouge px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wider text-signal transition-all hover:bg-rouge/90 active:translate-y-px"
            >
              {t.cta}
            </button>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-2-dark">
              {t.ctaHint}
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
