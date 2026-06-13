import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { CarArt, type CarBody } from "./car-art"
import { Odometer } from "./odometer"
import { RouteBar } from "./route-bar"

/* The shop window: three honest answers to the same budget.
   Mobile: snap carousel with the next card peeking. md+: grid. */
export function Selection({ dict }: { dict: Dictionary }) {
  const t = dict.selection
  return (
    <section
      id="cars"
      className="tarmac relative scroll-mt-20 overflow-hidden bg-asphalte"
    >
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-jaune">
          <span className="h-[3px] w-9 bg-jaune" aria-hidden="true" />
          {t.kicker}
        </p>
        <h2 className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3 font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight text-signal sm:gap-x-4 sm:text-5xl rtl:leading-[1.25] rtl:tracking-normal">
          <span>{t.titlePre}</span>
          <Odometer value={t.budget} unit={t.budgetUnit} size="sm" />
          <span>{t.titlePost}</span>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2-dark sm:text-lg">
          {t.sub}
        </p>

        <div className="mt-8 flex items-center justify-between gap-4 md:hidden">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2-dark">
            {t.swipeHint}
          </p>
          <span
            className="swipe-cue shrink-0 font-mono text-xl font-bold text-jaune rtl:rotate-180"
            aria-hidden="true"
          >
            →
          </span>
        </div>

        {/* Reveal the whole scroller as one unit — staggering individual cards
            inside a horizontal scroller fights the scroll axis */}
        <div
          data-reveal
          className="scrollbar-none -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:p-0"
        >
          {t.cars.map((car, i) => {
            return (
              <article
                key={car.name}
                className="plate group w-[81%] max-w-[400px] shrink-0 snap-start bg-bitume transition-colors hover:bg-bitume/70 md:w-auto md:max-w-none"
              >
                <div className="bp-grid relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-signal/12 bg-asphalte px-6">
                  <span
                    className="block w-full max-w-[290px] text-signal/85 transition-transform duration-500 group-hover:translate-x-2 rtl:group-hover:-translate-x-2"
                    aria-hidden="true"
                  >
                    <CarArt body={car.body as CarBody} />
                  </span>
                </div>
                <div className="px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-tight text-signal rtl:tracking-normal">
                      {car.name}
                    </h3>
                    <span className="mt-0.5 shrink-0 font-stencil text-2xl leading-none text-signal/20">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2-dark">
                    <span
                      className={
                        car.badgeType === "new"
                          ? "text-vert-light"
                          : "text-jaune"
                      }
                    >
                      {car.badge}
                    </span>
                    {" · "}
                    {car.detail}
                  </p>

                  <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-dashed border-signal/15 pt-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2-dark">
                      {t.priceLabel}
                    </span>
                    <span
                      className="whitespace-nowrap font-mono text-base font-bold text-signal"
                      dir="ltr"
                    >
                      {car.price}
                      <span className="ms-1 text-[10px] font-normal text-ink-2-dark">
                        {t.priceUnit}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2-dark">
                      <span className="hatch h-1.5 w-3" aria-hidden="true" />
                      {t.trueLabel}
                    </span>
                    <span
                      className="whitespace-nowrap font-mono text-xl font-bold text-jaune"
                      dir="ltr"
                    >
                      {car.monthly}
                      <span className="ms-1 text-[10px] font-normal uppercase">
                        {t.monthlyUnit}
                      </span>
                    </span>
                  </div>
                  <div className="mt-4">
                    <RouteBar segments={dict.instrument.segments} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div
          className="mt-4 flex items-center justify-center gap-2 md:hidden"
          aria-hidden="true"
        >
          {t.cars.map((car, i) => (
            <span
              key={car.name}
              className={
                i === 0
                  ? "h-1.5 w-7 bg-jaune"
                  : "h-1.5 w-2.5 bg-signal/25"
              }
            />
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-2-dark">
          {t.note}
        </p>
      </div>
    </section>
  )
}
