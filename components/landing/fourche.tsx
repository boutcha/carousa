import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

function BetterTick({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <span
      className="ms-1.5 inline-block size-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-vert align-middle"
      aria-hidden="true"
    />
  )
}

/* La Fourche: same budget, two roads — and an honest refusal to crown a universal winner. */
export function Fourche({ dict }: { dict: Dictionary }) {
  const t = dict.fourche
  return (
    <section className="paper-grain relative bg-paper text-asphalte">
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading kicker={t.kicker} title={t.title} sub={t.sub} />

        <div className="roadline-v mx-auto mt-8 h-10 md:mt-10 md:h-12" aria-hidden="true" />

        <div className="mt-0 border-2 border-asphalte bg-signal">
          {/* Direction-sign headers */}
          <div className="grid grid-cols-[minmax(0,1fr)_84px_84px] sm:grid-cols-[minmax(0,1fr)_140px_140px]">
            <div />
            <div className="bg-asphalte px-1 py-3 text-center font-display text-base font-bold uppercase tracking-wide text-signal sm:px-2 sm:text-lg rtl:tracking-normal">
              {t.colNew}
            </div>
            <div className="border-s border-signal/20 bg-asphalte px-1 py-3 text-center font-display text-base font-bold uppercase tracking-wide text-signal sm:px-2 sm:text-lg rtl:tracking-normal">
              {t.colUsed}
            </div>
          </div>

          {t.rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_84px_84px] items-baseline border-t border-asphalte/12 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_140px_140px] sm:px-5"
            >
              <span className="leader flex min-w-0 items-baseline pe-3 text-sm text-asphalte">
                <span className="bg-signal pe-2">{row.label}</span>
              </span>
              <span
                className={cn(
                  "text-center font-mono text-sm",
                  row.better === "new" ? "font-bold" : "text-asphalte/75"
                )}
                dir="ltr"
              >
                {row.newVal}
                <BetterTick active={row.better === "new"} />
              </span>
              <span
                className={cn(
                  "text-center font-mono text-sm",
                  row.better === "used" ? "font-bold" : "text-asphalte/75"
                )}
                dir="ltr"
              >
                {row.usedVal}
                <BetterTick active={row.better === "used"} />
              </span>
            </div>
          ))}

          {/* Totals */}
          <div className="grid grid-cols-[minmax(0,1fr)_84px_84px] items-baseline border-t-2 border-asphalte bg-paper px-3 py-4 sm:grid-cols-[minmax(0,1fr)_140px_140px] sm:px-5">
            <span className="font-display text-base font-bold uppercase tracking-tight sm:text-lg rtl:tracking-normal">
              {t.totalLabel}
            </span>
            <span className="text-center font-mono text-base font-bold" dir="ltr">
              {t.newTotal}
            </span>
            <span className="text-center font-mono text-base font-bold" dir="ltr">
              {t.usedTotal}
              <BetterTick active />
            </span>
          </div>

          {/* Verdict strip */}
          <div className="border-t-2 border-asphalte bg-asphalte px-5 py-5 text-signal">
            <p className="max-w-3xl leading-relaxed text-signal/90">
              {t.verdict}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
