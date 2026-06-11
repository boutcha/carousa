import { cn } from "@/lib/utils"

export type Segment = {
  label: string
  amount: string
  share: number
  type: string
}

/* The honesty notation: solid ink = contractual, yellow hatch = estimate. */
export function RouteBar({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex h-2 items-stretch gap-[2px]" dir="ltr">
      {segments.map((seg, i) => (
        <div
          key={seg.label}
          className={cn(
            "seg-grow",
            seg.type === "contract" ? "bg-vert-light" : "hatch"
          )}
          style={{
            width: `${seg.share}%`,
            animationDelay: `${0.15 + i * 0.09}s`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function HonestyChip({
  type,
  labelContract,
  labelEstimate,
}: {
  type: string
  labelContract: string
  labelEstimate: string
}) {
  const contract = type === "contract"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
        contract
          ? "border-vert-light/40 text-vert-light"
          : "border-jaune/40 text-jaune"
      )}
    >
      <span
        className={cn("h-1.5 w-3", contract ? "bg-vert-light" : "hatch")}
        aria-hidden="true"
      />
      {contract ? labelContract : labelEstimate}
    </span>
  )
}
