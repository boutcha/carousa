import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { CarArt, DimensionLine } from "./car-art"

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.hero
  const sc = dict.showcase

  return (
    <section className="tarmac relative overflow-hidden bg-asphalte">
      {/* The one ambient animation of this viewport */}
      <div
        className="centerline absolute inset-x-0 bottom-16 opacity-25"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-28 pt-14 lg:grid-cols-[6.5fr_5.5fr] lg:gap-14 lg:pb-32 lg:pt-20">
        <div className="min-w-0">
          <p className="rise font-mono text-[11px] uppercase tracking-[0.28em] text-jaune">
            {t.kicker}
          </p>
          <h1 className="rise mt-6 font-display font-bold uppercase leading-[0.95] tracking-tight text-signal [animation-delay:.08s] rtl:leading-[1.22] rtl:tracking-normal">
            <span className="block text-[clamp(3rem,7.5vw,5.1rem)] rtl:text-[clamp(2.5rem,6vw,4.2rem)]">
              {t.h1l1}
            </span>
            <span className="block text-[clamp(3rem,7.5vw,5.1rem)] rtl:text-[clamp(2.5rem,6vw,4.2rem)]">
              {t.h1l2}
            </span>
            <span className="hatch-underline mt-1 inline-block text-[clamp(3rem,7.5vw,5.1rem)] rtl:text-[clamp(2.5rem,6vw,4.2rem)]">
              {t.h1l3}
            </span>
          </h1>
          <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-ink-2-dark [animation-delay:.16s]">
            {t.sub}
          </p>

          {/* Le Guichet — budget input as an embossed plate */}
          <form
            action={`/${locale}/trouver`}
            className="rise mt-10 max-w-md [animation-delay:.24s]"
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

        {/* The showcase: the car arrives first; the price is the proof */}
        <div className="relative min-w-0">
          <div className="drive text-signal">
            <CarArt body="stepway" className="mx-auto w-full max-w-[440px]" />
          </div>
          {/* the road under the car */}
          <div className="mx-auto -mt-[7px] h-[2.5px] max-w-[460px] bg-signal/60" aria-hidden="true" />
          <div className="mx-auto mt-3 max-w-[440px]">
            <DimensionLine label={sc.dim} />
          </div>

          <div className="rise relative mx-auto mt-6 max-w-[440px] [animation-delay:.9s]">
            <div
              className="stamp-strike absolute -top-5 -end-2 z-10 border-[3px] border-rouge px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-rouge [animation-delay:1.7s]"
            >
              {t.stamp}
            </div>
            <div className="plate flex flex-wrap items-stretch bg-bitume">
              <div className="min-w-0 flex-1 px-4 py-3">
                <p className="truncate font-display text-lg font-bold uppercase tracking-tight text-signal rtl:tracking-normal">
                  {sc.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-vert-light">
                  {sc.badge}
                </p>
              </div>
              <div className="flex items-center border-s border-signal/15 px-4 font-mono text-lg font-bold text-signal">
                <span dir="ltr">{sc.price}</span>
                <span className="ms-1.5 text-[10px] text-ink-2-dark">
                  {sc.priceUnit}
                </span>
              </div>
            </div>
            <div className="plate mt-2 flex items-center justify-between gap-3 bg-bitume px-4 py-3">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
                <span className="hatch h-1.5 w-3" aria-hidden="true" />
                {sc.trueLabel}
              </span>
              <a
                href="#costs"
                className="group flex items-baseline gap-1.5 whitespace-nowrap font-mono text-xl font-bold text-jaune"
              >
                <span dir="ltr">{sc.monthly}</span>
                <span className="text-[10px] uppercase">{sc.monthlyUnit}</span>
                <span
                  className="ms-1 inline-block transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
