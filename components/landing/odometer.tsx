import { cn } from "@/lib/utils"

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

/* Mechanical drum digits — each column rolls once into place (CSS only). */
export function Odometer({
  value,
  unit,
  size = "lg",
}: {
  value: string
  unit: string
  size?: "lg" | "sm"
}) {
  const chars = [...value]
  let drumIndex = 0

  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-stretch gap-[3px] font-mono font-bold leading-none",
        size === "lg" ? "text-[2.6rem] sm:text-[3.1rem]" : "text-[1.5rem]"
      )}
    >
      {chars.map((ch, i) => {
        if (!/[0-9]/.test(ch)) {
          return (
            <span key={i} aria-hidden="true" className="w-[0.18em]" />
          )
        }
        const delay = `${drumIndex++ * 0.08}s`
        return (
          <span
            key={i}
            className="block h-[1.25em] overflow-hidden bg-signal px-[0.14em] text-asphalte"
            style={{ borderRadius: "2px" }}
          >
            <span
              className="odo-col"
              style={
                {
                  "--d": ch,
                  "--row": "-1.25em",
                  animationDelay: delay,
                } as React.CSSProperties
              }
              aria-hidden="true"
            >
              {DIGITS.map((d) => (
                <span
                  key={d}
                  className="flex h-[1.25em] items-center justify-center"
                >
                  {d}
                </span>
              ))}
            </span>
            <span className="sr-only">{ch}</span>
          </span>
        )
      })}
      <span
        className={cn(
          "flex items-center bg-rouge font-mono font-bold uppercase tracking-wider text-signal",
          size === "lg"
            ? "px-2 text-[11px] sm:text-xs"
            : "px-1.5 text-[9px]"
        )}
        style={{ borderRadius: "2px" }}
      >
        {unit}
      </span>
    </span>
  )
}
