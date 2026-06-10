import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

function PointList({
  points,
  onCobalt = false,
}: {
  points: string[]
  onCobalt?: boolean
}) {
  return (
    <ul className="mt-5 space-y-3">
      {points.map((point, i) => {
        const isCon = i === points.length - 1
        const Icon = isCon ? Minus : Plus
        return (
          <li key={point} className="flex items-start gap-2.5">
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                onCobalt
                  ? isCon
                    ? "text-background/60"
                    : "text-background"
                  : isCon
                    ? "text-terracotta-deep"
                    : "text-primary"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-sm leading-relaxed",
                onCobalt ? "text-primary-foreground/90" : "text-foreground/85"
              )}
            >
              {point}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function NewVsUsed({ dict }: { dict: Dictionary }) {
  const t = dict.vs
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading kicker={t.kicker} title={t.title} center />
      <div className="relative mt-12 grid overflow-hidden rounded-2xl border-2 border-foreground shadow-warm md:grid-cols-2">
        <div className="bg-card p-8 pb-10">
          <h3 className="font-display text-2xl font-semibold">
            {t.newCol.title}
          </h3>
          <PointList points={t.newCol.points} />
        </div>
        <div className="bg-primary p-8 pb-10 text-primary-foreground">
          <h3 className="font-display text-2xl font-semibold">
            {t.usedCol.title}
          </h3>
          <PointList points={t.usedCol.points} onCobalt />
        </div>
        <div
          className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] items-center justify-center rounded-full border-4 border-background bg-terracotta-deep font-display text-sm font-bold text-background max-md:hidden"
          aria-hidden="true"
        >
          VS
        </div>
      </div>
      <p className="mt-10 text-center font-display text-2xl italic">
        {t.tagline}
      </p>
    </section>
  )
}
