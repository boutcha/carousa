import {
  Activity,
  Fuel,
  Landmark,
  ShieldCheck,
  TrendingDown,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { SectionHeading } from "./section-heading"

const icons = [Landmark, ShieldCheck, Fuel, Wrench, Activity, TrendingDown]

export function CostGrid({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="costs"
      className="relative scroll-mt-20 overflow-hidden bg-foreground text-background"
    >
      <div className="absolute inset-0 bg-zellige-light" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          kicker={dict.costs.kicker}
          title={dict.costs.title}
          sub={dict.costs.sub}
          onDark
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.costs.items.map((item, i) => {
            const Icon = icons[i] ?? Landmark
            const inverted = i === dict.costs.items.length - 1
            return (
              <div
                key={item.title}
                className={cn(
                  "rounded-xl border p-6",
                  inverted
                    ? "border-terracotta bg-terracotta text-background"
                    : "border-background/15 bg-background/[0.04]"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md",
                    inverted ? "bg-background/20" : "bg-background/10"
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    inverted ? "text-background/85" : "text-background/65"
                  )}
                >
                  {item.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
