import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

export function Roadmap({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-t border-foreground/10 bg-secondary/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading kicker={dict.roadmap.kicker} title={dict.roadmap.title} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {dict.roadmap.items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-dashed border-foreground/25 bg-card/60 p-6"
            >
              <span className="inline-block rounded-full border border-terracotta-deep/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta-deep">
                {dict.roadmap.soon}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
