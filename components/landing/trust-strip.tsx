import type { Dictionary } from "@/lib/i18n/get-dictionary"

/* Methodological claims as stamped plaques — no fake partner logos. */
export function TrustStrip({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-y border-signal/12 bg-asphalte">
      <div className="mx-auto flex max-w-6xl items-stretch gap-3 overflow-x-auto px-6 py-5">
        {dict.trust.plaques.map((plaque) => (
          <div
            key={plaque}
            className="plate flex shrink-0 items-center bg-bitume px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal/85"
          >
            {plaque}
          </div>
        ))}
      </div>
    </section>
  )
}
