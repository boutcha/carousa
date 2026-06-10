import { BadgeCheck, CalendarCheck, Scale } from "lucide-react"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

const icons = [BadgeCheck, CalendarCheck, Scale]

export function TrustStrip({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-y border-foreground/10 bg-secondary/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-5">
        {dict.trust.items.map((item, i) => {
          const Icon = icons[i] ?? BadgeCheck
          return (
            <div key={item} className="flex items-center gap-2.5 text-sm">
              <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </div>
          )
        })}
        <span className="font-mono text-xs text-muted-foreground">
          {dict.trust.updated}
        </span>
      </div>
    </section>
  )
}
