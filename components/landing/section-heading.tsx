import { cn } from "@/lib/utils"

export function SectionHeading({
  kicker,
  title,
  sub,
  onDark = false,
  center = false,
}: {
  kicker: string
  title: string
  sub?: string
  onDark?: boolean
  center?: boolean
}) {
  return (
    <div className={cn(center && "mx-auto max-w-3xl text-center")}>
      <p
        className={cn(
          "font-mono text-xs uppercase tracking-[0.2em]",
          onDark ? "text-terracotta" : "text-terracotta-deep"
        )}
      >
        {kicker}
      </p>
      <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            "mt-4 max-w-2xl text-lg leading-relaxed",
            onDark ? "text-background/70" : "text-muted-foreground",
            center && "mx-auto"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
