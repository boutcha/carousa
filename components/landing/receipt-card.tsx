import type { Dictionary } from "@/lib/i18n/get-dictionary"

export function ReceiptCard({ dict }: { dict: Dictionary }) {
  const t = dict.receipt

  return (
    <div className="anim-rise relative min-w-0 [animation-delay:.2s]">
      {/* Horseshoe arch, the Moroccan frame behind the receipt */}
      <svg
        className="absolute -top-16 left-1/2 -z-10 h-auto w-[470px] -translate-x-1/2 text-primary/20"
        viewBox="0 0 160 210"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M30 206 V88 A58 58 0 1 1 130 88 V206"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </svg>

      <div className="sawtooth relative mx-auto w-[min(100%,360px)] rotate-[-1.6deg] rounded-t-lg border border-foreground/15 bg-card p-6 shadow-offset">
        {/* Rubber stamp */}
        <div
          className="anim-stamp absolute -top-4 -end-4 z-10 rounded-sm border-[3px] border-terracotta-deep px-3 py-1 font-display text-sm font-bold uppercase tracking-[0.15em] text-terracotta-deep mix-blend-multiply [animation-delay:1.5s]"
        >
          {t.stamp}
        </div>

        <p className="font-display text-lg font-semibold leading-snug">
          {t.carName}
        </p>
        <p className="mt-0.5 font-mono text-sm text-muted-foreground">
          <span dir="ltr">{t.carPrice}</span>
        </p>
        <p className="mt-3 font-display italic text-muted-foreground">
          {t.adQuote}
        </p>

        <div className="my-4 border-t border-dashed border-foreground/25" />

        <div>
          {t.lines.map((line, i) => (
            <div
              key={line.label}
              className="anim-print flex items-baseline justify-between gap-4 py-1.5"
              style={{ animationDelay: `${0.45 + i * 0.18}s` }}
            >
              <span className="text-sm text-foreground/80">{line.label}</span>
              <span
                className="font-mono text-sm tabular-nums text-foreground"
                dir="ltr"
              >
                {line.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t-[3px] border-double border-foreground/40 pt-4">
          <div className="flex items-end justify-between gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.totalLabel}
            </span>
            <span
              className="anim-print whitespace-nowrap font-display text-[1.75rem] font-bold leading-none text-primary [animation-delay:1.25s]"
              dir="ltr"
            >
              {t.total}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {t.footnote}
        </p>
      </div>
    </div>
  )
}
