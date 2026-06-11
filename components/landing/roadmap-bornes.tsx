import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

/* Milestones as bornes kilométriques. Future ones are hatched: not promised yet. */
export function RoadmapBornes({ dict }: { dict: Dictionary }) {
  return (
    <section className="km-ruler border-t border-asphalte/10 bg-[#e9eae3] pb-24 pt-3 text-asphalte">
      <div className="mx-auto max-w-6xl px-6 pt-20">
        <SectionHeading kicker={dict.roadmap.kicker} title={dict.roadmap.title} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.roadmap.items.map((item) => {
            const now = item.status === "now"
            return (
              <div
                key={item.title}
                className={cn(
                  "view-rise overflow-hidden rounded-t-[14px] rounded-b-[2px]",
                  now
                    ? "border border-asphalte/25 bg-signal"
                    : "hatch-border bg-signal/55"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 items-center justify-center font-mono text-[11px] font-bold uppercase tracking-[0.18em]",
                    now
                      ? "bg-rouge text-signal"
                      : "bg-asphalte/70 text-signal/90"
                  )}
                >
                  {item.date}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold uppercase leading-snug tracking-tight rtl:tracking-normal">
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
