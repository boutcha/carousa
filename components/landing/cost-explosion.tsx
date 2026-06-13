"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { CarArt, type CarBody } from "./car-art"
import { Odometer } from "./odometer"
import type { Segment } from "./route-bar"
import { useInView } from "@/lib/hooks/use-in-view"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

type Phase = "idle" | "drawing" | "callouts" | "resolved"

/* Callout slots around the car, in % of the stage. `from` is where the leader
   line leaves the plate, `to` is the anchor on the drawing. Physical left/right
   on purpose: the SVG overlay doesn't flip in RTL, and the car flips itself. */
const SLOTS: ReadonlyArray<{
  side: "left" | "right"
  top: string
  from: [number, number]
  to: [number, number]
}> = [
  { side: "left", top: "3%", from: [30.5, 12], to: [41, 37] },
  { side: "right", top: "3%", from: [69.5, 12], to: [60, 34] },
  { side: "left", top: "38%", from: [30.5, 47], to: [33, 52] },
  { side: "right", top: "38%", from: [69.5, 47], to: [69, 52] },
  { side: "left", top: "73%", from: [30.5, 82], to: [41, 68] },
  { side: "right", top: "73%", from: [69.5, 82], to: [61, 68] },
]

/* The set-piece, as an exploded engineering view: the blueprint draws itself,
   leader lines extend to the six real monthly costs, and the figure resolves
   into the true monthly total. Fires once on scroll-in (or on mount when
   `eager`, for above-the-fold use); tap the price to replay. */
export function CostExplosion({
  segments,
  price,
  priceUnit,
  priceLabel,
  total,
  totalUnit,
  trueLabel,
  legendContract,
  legendEstimate,
  replayHint,
  stamp,
  eager = false,
  body = "stepway",
}: {
  segments: Segment[]
  price: string
  priceUnit: string
  priceLabel: string
  total: string
  totalUnit: string
  trueLabel: string
  legendContract: string
  legendEstimate: string
  replayHint: string
  stamp?: string
  eager?: boolean
  body?: CarBody
}) {
  const reduced = useReducedMotion()
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.35 })

  const [phase, setPhase] = useState<Phase>("idle")
  const [runId, setRunId] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const play = useCallback(() => {
    clearTimers()
    setRunId((n) => n + 1)
    if (reduced) {
      setPhase("resolved")
      return
    }
    setPhase("idle")
    const at = (ms: number, fn: () => void) =>
      timers.current.push(setTimeout(fn, ms))
    at(60, () => setPhase("drawing"))
    at(1200, () => setPhase("callouts"))
    at(2450, () => setPhase("resolved"))
  }, [clearTimers, reduced])

  // Fire once — on mount when eager (above the fold), else on scroll-in.
  const started = useRef(false)
  useEffect(() => {
    if (!eager || started.current) return
    started.current = true
    const t = setTimeout(play, 350)
    return () => clearTimeout(t)
  }, [eager, play])
  useEffect(() => {
    if (inView && !started.current) {
      started.current = true
      play()
    }
  }, [inView, play])

  useEffect(() => clearTimers, [clearTimers])

  const calloutsOn = phase === "callouts" || phase === "resolved"
  const resolved = phase === "resolved"

  return (
    <div ref={ref} className="relative">
      {/* Sticker price — tap to replay */}
      <button
        type="button"
        onClick={play}
        aria-label={replayHint}
        className="group block w-full text-start"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
          {priceLabel}
        </span>
        <span className="mt-1 flex items-baseline gap-3">
          <span
            className={cn(
              "font-display text-[clamp(2.4rem,11vw,3.4rem)] font-bold leading-none text-signal transition-opacity duration-500",
              resolved ? "opacity-35" : "opacity-100"
            )}
            dir="ltr"
          >
            {price}
            <span className="ms-1.5 text-base text-ink-2-dark">{priceUnit}</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-jaune opacity-0 transition-opacity group-hover:opacity-100">
            ↻ {replayHint}
          </span>
        </span>
      </button>

      {/* The exploded view: car at centre, leader lines out to the costs */}
      <div className="plate bp-grid relative mt-4 h-[300px] overflow-hidden bg-bitume sm:h-[340px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {segments.map((seg, i) => {
            const s = SLOTS[i % SLOTS.length]
            return (
              <line
                key={seg.label}
                x1={s.from[0]}
                y1={s.from[1]}
                x2={s.to[0]}
                y2={s.to[1]}
                pathLength={1}
                stroke={
                  seg.type === "contract"
                    ? "rgb(86 184 139 / 0.55)"
                    : "rgb(239 190 69 / 0.55)"
                }
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className={cn("bp-lead", calloutsOn && "is-drawn")}
                style={{
                  animationDelay: !reduced ? `${i * 110}ms` : "0ms",
                }}
              />
            )
          })}
        </svg>

        <span
          key={runId}
          className={cn(
            "pointer-events-none absolute left-1/2 top-[47%] w-[58%] max-w-[300px] -translate-x-1/2 -translate-y-1/2 text-signal/80",
            phase === "idle" ? "opacity-0" : "bp-draw-anim opacity-100"
          )}
          aria-hidden="true"
        >
          <CarArt body={body} />
        </span>

        {segments.map((seg, i) => {
          const s = SLOTS[i % SLOTS.length]
          const contract = seg.type === "contract"
          const pos =
            s.side === "left"
              ? { left: "2.5%", top: s.top }
              : { right: "2.5%", top: s.top }

          return (
            <span
              key={seg.label}
              className={cn(
                "absolute z-10 w-[27%] min-w-[96px] border bg-asphalte/90 p-1.5 font-mono uppercase leading-tight transition-all duration-300",
                contract ? "border-vert-light/50" : "border-jaune/50",
                calloutsOn
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1.5 opacity-0"
              )}
              style={{
                ...pos,
                transitionDelay:
                  calloutsOn && !reduced ? `${i * 110}ms` : "0ms",
              }}
            >
              <span
                className={cn(
                  "flex items-center justify-between gap-1 text-[8px] tracking-[0.08em]",
                  contract ? "text-vert-light" : "text-jaune"
                )}
              >
                {seg.label}
                <span
                  className={cn("h-1 w-3 shrink-0", contract ? "bg-vert-light" : "hatch")}
                  aria-hidden="true"
                />
              </span>
              <b className="mt-0.5 block text-[13px] text-signal" dir="ltr">
                {seg.amount}
              </b>
            </span>
          )
        })}
      </div>

      {/* The resolution: the true monthly cost */}
      <div
        className={cn(
          "plate relative mt-3 flex items-center justify-between gap-3 bg-bitume px-4 py-3.5 transition-all duration-500",
          resolved
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2.5 opacity-0"
        )}
      >
        {stamp && resolved && (
          <span className="stamp-strike absolute -top-4 -end-2 z-10 border-[3px] border-rouge px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-rouge [animation-delay:.5s]">
            {stamp}
          </span>
        )}
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2-dark">
          <span className="hatch h-1.5 w-3" aria-hidden="true" />
          {trueLabel}
        </span>
        {resolved ? (
          <Odometer key={runId} value={total} unit={totalUnit} size="sm" />
        ) : (
          <span className="font-mono text-2xl font-bold text-jaune" dir="ltr">
            {total}
          </span>
        )}
      </div>

      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-ink-2-dark">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 bg-vert-light" aria-hidden="true" />
          {legendContract}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="hatch h-1.5 w-3" aria-hidden="true" />
          {legendEstimate}
        </span>
      </p>
    </div>
  )
}
