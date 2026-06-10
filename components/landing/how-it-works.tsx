import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

export function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <SectionHeading kicker={dict.how.kicker} title={dict.how.title} />
      <div className="mt-14 grid gap-6 md:grid-cols-3 md:pb-16">
        {dict.how.steps.map((step, i) => (
          <div
            key={step.title}
            className={cn(
              "relative rounded-xl border border-foreground/10 bg-card p-7 pt-20 shadow-warm",
              i === 1 && "md:translate-y-8",
              i === 2 && "md:translate-y-16"
            )}
          >
            <span
              className="absolute start-5 top-4 select-none font-display text-7xl font-bold leading-none text-primary/10"
              aria-hidden="true"
            >
              0{i + 1}
            </span>
            <h3 className="font-display text-2xl font-semibold">
              {step.title}
            </h3>
            <p className="mt-2.5 leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
