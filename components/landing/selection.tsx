import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { CarArt, type CarBody } from "./car-art"
import { Odometer } from "./odometer"
import { RouteBar } from "./route-bar"

/* The shop window: three honest answers to the same budget. */
export function Selection({ dict }: { dict: Dictionary }) {
  const t = dict.selection
  return (
    <section
      id="cars"
      className="tarmac relative scroll-mt-20 overflow-hidden bg-asphalte"
    >
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-jaune">
          <span className="h-[3px] w-9 bg-jaune" aria-hidden="true" />
          {t.kicker}
        </p>
        <h2 className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight text-signal sm:text-5xl rtl:leading-[1.25] rtl:tracking-normal">
          <span>{t.titlePre}</span>
          <Odometer value={t.budget} unit={t.budgetUnit} size="sm" />
          <span>{t.titlePost}</span>
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2-dark">
          {t.sub}
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.cars.map((car, i) => (
            <article
              key={car.name}
              className="view-rise plate group bg-bitume transition-colors hover:bg-bitume/70"
            >
              <div className="border-b border-signal/12 px-5 pb-4 pt-6 text-signal">
                <CarArt body={car.body as CarBody} className="w-full" />
                <div className="-mt-[5px] h-[2px] bg-signal/40" aria-hidden="true" />
              </div>
              <div className="px-5 pb-6 pt-5">
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
                  <span className="whitespace-nowrap font-mono text-base font-bold text-signal" dir="ltr">
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
                  <span className="whitespace-nowrap font-mono text-xl font-bold text-jaune" dir="ltr">
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
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-2-dark">
          {t.note}
        </p>
      </div>
    </section>
  )
}
