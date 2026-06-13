import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

/* Three plaques sitting on a dashed centerline, roadbook style. */
export function Roadbook({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="how"
      className="paper-grain relative scroll-mt-20 bg-paper text-asphalte"
    >
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading kicker={dict.roadbook.kicker} title={dict.roadbook.title} />
        <div className="relative mt-10 md:mt-14">
          <div
            className="roadline absolute inset-x-0 top-1/2 hidden md:block"
            aria-hidden="true"
          />
          {/* On mobile the dashes run vertically between the plaques */}
          <div
            className="roadline-v absolute inset-y-4 start-8 md:hidden"
            aria-hidden="true"
          />
          <div className="relative grid gap-6 md:grid-cols-3">
            {dict.roadbook.steps.map((step) => (
              <div
                key={step.pk}
                data-reveal
                className="border border-asphalte/15 bg-signal"
              >
                <div className="flex h-2 bg-rouge" aria-hidden="true" />
                <div className="p-5 sm:p-6">
                  <p className="font-stencil text-5xl font-bold leading-none text-asphalte/15">
                    {step.pk}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight rtl:tracking-normal">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 leading-relaxed text-ink-2">
                    {step.body}
                  </p>
                  <p
                    className="mt-5 border-t border-dashed border-asphalte/25 pt-3.5 font-mono text-xs font-bold text-asphalte"
                  >
                    {step.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
