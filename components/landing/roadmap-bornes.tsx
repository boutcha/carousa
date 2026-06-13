import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

/* Milestones as bornes kilométriques. Future ones are hatched: not promised yet. */
export function RoadmapBornes({ dict }: { dict: Dictionary }) {
  return (
    <section className="km-ruler border-t border-asphalte/10 bg-[#e9eae3] pb-16 pt-3 text-asphalte md:pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 md:pt-20">
        <SectionHeading kicker={dict.roadmap.kicker} title={dict.roadmap.title} />
        <div className="mt-10 grid grid-cols-2 gap-4 md:mt-12 md:gap-6 lg:grid-cols-4">
          {dict.roadmap.items.map((item) => {
            const now = item.status === "now"
            return (
              <div
                key={item.title}
                data-reveal
                className={cn(
                  "overflow-hidden rounded-t-[14px] rounded-b-[2px]",
                  now
                    ? "border border-asphalte/25 bg-signal"
                    : "hatch-border bg-signal/55"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.18em]",
                    now
                      ? "bg-rouge text-signal"
                      : "bg-asphalte/70 text-signal/90"
                  )}
                >
                  {item.date}
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-display text-base font-bold uppercase leading-snug tracking-tight sm:text-lg rtl:tracking-normal">
                    {item.title}
                  </h3>
                  {now && (
                    <p className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rouge">
                      <span
                        className="inline-block size-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-rouge"
                        aria-hidden="true"
                      />
                      {dict.roadmap.here}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
