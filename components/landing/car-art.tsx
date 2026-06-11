import { cn } from "@/lib/utils"

export type CarBody = "stepway" | "citadine" | "suv"

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--asphalte)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <g className="wheel">
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.58}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {[0, 72, 144, 216, 288].map((a) => (
          <line
            key={a}
            x1={cx}
            y1={cy}
            x2={cx + r * 0.58 * Math.cos((a * Math.PI) / 180)}
            y2={cy + r * 0.58 * Math.sin((a * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
        <circle cx={cx} cy={cy} r={2.5} fill="currentColor" />
      </g>
    </g>
  )
}

/* Blueprint side profiles — engineering-drawing register, honest like the rest. */
export function CarArt({
  body,
  className,
}: {
  body: CarBody
  className?: string
}) {
  return (
    <span className={cn("block rtl:-scale-x-100", className)}>
      {body === "stepway" && (
        <svg viewBox="0 0 340 120" fill="none" aria-hidden="true">
          <path
            d="M24 92 L24 78 Q26 67 42 65 L116 58 L156 33 Q160 30 168 30 L234 30 Q242 30 248 36 L270 56 L284 60 Q292 62 293 72 L293 84 Q293 92 284 92 L278 92 A25 25 0 0 0 228 92 L114 92 A25 25 0 0 0 64 92 L34 92 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* glasshouse */}
          <path
            d="M128 56 L160 36 L196 36 L196 56 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M204 36 L230 36 Q239 37 244 43 L254 56 L204 56 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* roof rails */}
          <path d="M158 27 H238" stroke="currentColor" strokeWidth="2" />
          {/* doors + handles */}
          <path d="M200 56 V90" stroke="currentColor" strokeWidth="1.2" />
          <path d="M170 62 h12 M210 62 h12" stroke="currentColor" strokeWidth="1.5" />
          {/* mirror */}
          <path d="M126 56 l-9 -5 v7 Z" stroke="currentColor" strokeWidth="1.5" />
          {/* lights */}
          <path d="M26 70 L42 66 L42 73 L28 75 Z" fill="currentColor" opacity="0.7" />
          <path d="M288 64 L293 72" stroke="currentColor" strokeWidth="2.5" />
          {/* stepway cladding */}
          <path d="M44 84 H100 M128 84 H214 M242 84 H276" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <Wheel cx={89} cy={94} r={18} />
          <Wheel cx={253} cy={94} r={18} />
        </svg>
      )}
      {body === "citadine" && (
        <svg viewBox="0 0 340 120" fill="none" aria-hidden="true">
          <path
            d="M36 92 L36 80 Q38 70 52 68 L104 62 Q118 44 140 37 Q154 33 174 33 Q216 34 238 42 Q252 48 258 58 L268 63 Q276 66 277 76 L277 84 Q277 92 268 92 L262 92 A23 23 0 0 0 216 92 L122 92 A23 23 0 0 0 76 92 L44 92 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* glasshouse */}
          <path
            d="M116 58 L142 41 Q152 37 168 37 L178 37 L178 58 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M186 37 L212 38 Q232 40 244 54 L240 58 L186 58 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* doors + handles */}
          <path d="M182 58 V90" stroke="currentColor" strokeWidth="1.2" />
          <path d="M156 64 h11 M192 64 h11" stroke="currentColor" strokeWidth="1.5" />
          {/* mirror */}
          <path d="M114 58 l-9 -5 v7 Z" stroke="currentColor" strokeWidth="1.5" />
          {/* lights */}
          <path d="M38 72 L54 69 L54 76 L40 77 Z" fill="currentColor" opacity="0.7" />
          <path d="M270 66 L277 74" stroke="currentColor" strokeWidth="2.5" />
          <Wheel cx={99} cy={94} r={17} />
          <Wheel cx={239} cy={94} r={17} />
        </svg>
      )}
      {body === "suv" && (
        <svg viewBox="0 0 340 120" fill="none" aria-hidden="true">
          <path
            d="M22 90 L22 74 Q24 62 40 60 L110 54 L138 31 Q142 28 150 28 L252 28 Q260 28 262 34 L266 56 L284 60 Q294 62 295 72 L295 82 Q295 90 286 90 L280 90 A26 26 0 0 0 228 90 L118 90 A26 26 0 0 0 66 90 L32 90 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* glasshouse */}
          <path
            d="M122 52 L144 33 L182 33 L182 52 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M190 33 L246 33 Q252 33 253 38 L256 52 L190 52 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* roof rails */}
          <path d="M140 24 H250" stroke="currentColor" strokeWidth="2.5" />
          {/* doors + handles */}
          <path d="M186 52 V88 M124 52 V88" stroke="currentColor" strokeWidth="1.2" />
          <path d="M150 58 h12 M196 58 h12" stroke="currentColor" strokeWidth="1.5" />
          {/* mirror */}
          <path d="M120 52 l-10 -5 v7 Z" stroke="currentColor" strokeWidth="1.5" />
          {/* lights */}
          <path d="M24 66 L42 62 L42 70 L26 72 Z" fill="currentColor" opacity="0.7" />
          <path d="M290 64 L295 72" stroke="currentColor" strokeWidth="2.5" />
          {/* cladding */}
          <path d="M40 82 H104 M132 82 H212 M244 82 H280" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <Wheel cx={92} cy={92} r={20} />
          <Wheel cx={254} cy={92} r={20} />
        </svg>
      )}
    </span>
  )
}

/* Engineering-drawing dimension line under the showcase car */
export function DimensionLine({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-2-dark"
      dir="ltr"
    >
      <span className="h-3 w-px bg-current" aria-hidden="true" />
      <span className="h-px flex-1 bg-current opacity-60" aria-hidden="true" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-current opacity-60" aria-hidden="true" />
      <span className="h-3 w-px bg-current" aria-hidden="true" />
    </div>
  )
}
