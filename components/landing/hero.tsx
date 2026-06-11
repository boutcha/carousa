import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { Odometer } from "./odometer"
import { HonestyChip, RouteBar } from "./route-bar"

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.hero
  const inst = dict.instrument

  return (
    <section className="tarmac relative overflow-hidden bg-asphalte">
      {/* The one ambient animation of this viewport */}
      <div
        className="centerline absolute inset-x-0 bottom-16 opacity-25"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-6 pb-28 pt-14 lg:grid-cols-[7fr_5fr] lg:gap-16 lg:pb-32 lg:pt-20">
        <div className="min-w-0">
          <p className="rise font-mono text-[11px] uppercase tracking-[0.28em] text-jaune">
            {t.kicker}
          </p>
          <h1 className="rise mt-6 font-display font-bold uppercase leading-[0.95] tracking-tight text-signal [animation-delay:.08s] rtl:leading-[1.22] rtl:tracking-normal">
            <span className="block text-[clamp(3rem,8vw,5.4rem)] rtl:text-[clamp(2.5rem,6vw,4.3rem)]">
              {t.h1l1}
            </span>
            <span className="block text-[clamp(3rem,8vw,5.4rem)] rtl:text-[clamp(2.5rem,6vw,4.3rem)]">
              {t.h1l2}
            </span>
            <span className="hatch-underline mt-1 inline-block text-[clamp(3rem,8vw,5.4rem)] rtl:text-[clamp(2.5rem,6vw,4.3rem)]">
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

        {/* Le Compteur-Vérité */}
        <div className="rise relative min-w-0 [animation-delay:.2s]">
          <div className="plate relative bg-bitume p-6 sm:p-7">
            <div
              className="stamp-strike absolute -top-4 -end-3 z-10 border-[3px] border-rouge px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rouge [animation-delay:1.5s]"
            >
              {t.stamp}
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2-dark">
              {inst.caption}
            </p>

            <div className="mt-4">
              <Odometer value={inst.total} unit={inst.totalUnit} />
            </div>

            <div className="mt-6">
              <RouteBar segments={inst.segments} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {inst.segments.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-baseline justify-between gap-2 border-b border-signal/8 pb-1.5"
                >
                  <dt className="flex min-w-0 items-center gap-2 text-[13px] text-signal/80">
                    <span
                      className={
                        seg.type === "contract"
                          ? "h-1.5 w-3 shrink-0 bg-vert-light"
                          : "hatch h-1.5 w-3 shrink-0"
                      }
                      aria-hidden="true"
                    />
                    <span className="truncate">{seg.label}</span>
                  </dt>
                  <dd
                    className="font-mono text-[13px] font-bold text-signal"
                    dir="ltr"
                  >
                    {seg.amount}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <HonestyChip
                type="contract"
                labelContract={inst.legendContract}
                labelEstimate={inst.legendEstimate}
              />
              <HonestyChip
                type="estimate"
                labelContract={inst.legendContract}
                labelEstimate={inst.legendEstimate}
              />
            </div>

            <p className="mt-5 border-t border-dashed border-signal/15 pt-4 font-mono text-[10px] leading-relaxed text-ink-2-dark">
              {inst.example}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
