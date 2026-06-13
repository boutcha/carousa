import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { Odometer } from "./odometer"
import { HonestyChip } from "./route-bar"
import { SectionHeading } from "./section-heading"

/* The centerpiece: a ledger, not a card grid — because tables are honest. */
export function GrandLivre({ dict }: { dict: Dictionary }) {
  const t = dict.ledger
  return (
    <section
      id="costs"
      className="tarmac relative scroll-mt-20 overflow-hidden bg-asphalte"
    >
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading kicker={t.kicker} title={t.title} sub={t.sub} onDark />

        <div className="mt-10 border-t border-signal/15 md:mt-14">
          {t.rows.map((row, i) => (
            <div
              key={row.name}
              data-reveal
              className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3.5 border-b border-signal/12 py-5 transition-colors hover:bg-bitume/60 md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,200px)_minmax(0,180px)] md:items-center md:gap-x-6 md:gap-y-3 md:py-6"
            >
              <span
                className="font-stencil text-2xl leading-none text-signal/25 md:text-3xl"
                aria-hidden="true"
              >
                0{i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-signal rtl:tracking-normal">
                  {row.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2-dark">
                  {row.note}
                </p>
              </div>
              <div className="hidden md:block" aria-hidden="true">
                <div className="h-2 w-full bg-signal/8">
                  <div
                    className={cn(
                      "h-full",
                      row.type === "contract" ? "bg-vert-light" : "hatch"
                    )}
                    style={{ width: `${row.share}%` }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-ink-2-dark">
                  {row.source}
                </p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 md:col-start-auto md:flex-col md:items-end md:gap-1.5">
                <span
                  className="font-mono text-xl font-bold text-signal"
                  dir="ltr"
                >
                  {row.amount}
                  <sup>
                    <a
                      href="#sources"
                      className="ms-0.5 text-[10px] text-jaune no-underline"
                    >
                      [{i + 1}]
                    </a>
                  </sup>
                </span>
                <HonestyChip
                  type={row.type}
                  labelContract={dict.instrument.legendContract}
                  labelEstimate={dict.instrument.legendEstimate}
                />
                <p className="w-full font-mono text-[10px] text-ink-2-dark md:hidden">
                  {row.source}
                </p>
              </div>
            </div>
          ))}

          {/* The audit foot */}
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 bg-bitume px-4 py-5 sm:px-7 sm:py-6">
            <span className="font-display text-xl font-bold uppercase tracking-tight text-signal sm:text-2xl rtl:tracking-normal">
              {t.totalLabel}
            </span>
            <Odometer value={t.total} unit={t.totalUnit} size="sm" />
          </div>
        </div>

        <p className="mt-5 font-mono text-[11px] text-ink-2-dark">
          {t.footnote}
        </p>
      </div>
    </section>
  )
}
