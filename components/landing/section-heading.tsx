import { cn } from "@/lib/utils"

export function SectionHeading({
  kicker,
  title,
  sub,
  onDark = false,
}: {
  kicker: string
  title: string
  sub?: string
  onDark?: boolean
}) {
  return (
    <div>
      <p
        className={cn(
          "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em]",
          onDark ? "text-jaune" : "text-rouge"
        )}
      >
        <span
          className={cn("h-[3px] w-9", onDark ? "bg-jaune" : "bg-rouge")}
          aria-hidden="true"
        />
        {kicker}
      </p>
      <h2
        className={cn(
          "mt-4 font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight sm:text-5xl rtl:leading-[1.25] rtl:tracking-normal",
          onDark ? "text-signal" : "text-asphalte"
        )}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            "mt-4 max-w-2xl text-lg leading-relaxed",
            onDark ? "text-ink-2-dark" : "text-ink-2"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
