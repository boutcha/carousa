import { ImageResponse } from "next/og"
import type { Locale } from "@/lib/i18n/config"
import { isRtl } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Carsablanca — PK 0"

const ASPHALTE = "#15171c"
const BITUME = "#22252c"
const SIGNAL = "#f4f5f0"
const JAUNE = "#efbe45"
const VERT = "#56b88b"
const ROUGE = "#ce3524"
const INK2 = "#9da2a6"

/* Fetch a family's TTFs from Google Fonts (css2 without a browser UA serves
   truetype). The css can split into several unicode-range faces (latin +
   arabic), so register every face — satori falls back across them. Returns []
   on any failure; the card then drops localized text rather than crash on
   glyphs no font covers. */
async function loadGoogleFonts(
  family: string,
  weight: number
): Promise<ArrayBuffer[]> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`
      )
    ).text()
    const urls = [
      ...css.matchAll(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/g),
    ].map((m) => m[1])
    const buffers = await Promise.all(
      urls.slice(0, 4).map(async (url) => {
        const res = await fetch(url)
        return res.ok ? res.arrayBuffer() : null
      })
    )
    return buffers.filter((b): b is ArrayBuffer => b !== null)
  } catch {
    return []
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = (await params).locale as Locale
  const dict = await getDictionary(locale)
  const rtl = isRtl(locale)

  // Harakat (combining marks) trip satori's shaper; the card reads fine
  // without them. Satori also lays words out LTR regardless of script, so
  // for RTL we reverse word order per non-wrapping line ourselves.
  const strip = (s: string) => (rtl ? s.replace(/[ً-ْٰ]/g, "") : s)
  const order = (s: string) =>
    rtl ? s.split(" ").reverse().join(" ") : s
  const fix = (s: string) => order(strip(s))
  const titleLines = [dict.hero.h1l1, dict.hero.h1l2, dict.hero.h1l3].map(fix)
  const trueLabel = fix(dict.selection.trueLabel)
  const priceLabel = fix(dict.selection.priceLabel)

  const displayFamily = rtl ? "Tajawal" : "Big Shoulders Display"
  const displayFonts = await loadGoogleFonts(displayFamily, 700)
  // Without an Arabic font, Arabic text would crash satori (no fallback
  // covers it) — drop to the brand-and-numbers card instead.
  const wantLocalText = !rtl || displayFonts.length > 0

  const card = (showLocalText: boolean) => (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: ASPHALTE,
          backgroundImage: `linear-gradient(rgba(244,245,240,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(244,245,240,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          color: SIGNAL,
          padding: "56px 72px",
          fontFamily: displayFonts.length ? displayFamily : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", gap: 4, height: 18 }}>
              <div style={{ width: 36, backgroundColor: VERT }} />
              <div style={{ width: 24, backgroundColor: JAUNE }} />
              <div style={{ width: 16, backgroundColor: ROUGE }} />
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>
              CARSABLANCA
            </div>
          </div>
          <div style={{ fontSize: 22, color: JAUNE, letterSpacing: 3 }}>
            PK 0 · CASABLANCA
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            // mirror the composition for Arabic: text right, car left
            flexDirection: rtl ? "row-reverse" : "row",
          }}
        >
          {showLocalText ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 560,
                fontSize: 58,
                lineHeight: 1.08,
                fontWeight: 700,
                alignItems: rtl ? "flex-end" : "flex-start",
                // satori chokes on explicit `undefined` style values — only
                // include keys when they have real values
                ...(rtl ? {} : { textTransform: "uppercase" as const }),
              }}
            >
              {titleLines.map((line) => (
                <div key={line} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 64,
                fontWeight: 700,
              }}
            >
              CARSABLANCA.MA
            </div>
          )}

          <svg width="480" height="170" viewBox="0 0 340 120" fill="none">
            <path
              d="M24 92 L24 78 Q26 67 42 65 L116 58 L156 33 Q160 30 168 30 L234 30 Q242 30 248 36 L270 56 L284 60 Q292 62 293 72 L293 84 Q293 92 284 92 L278 92 A25 25 0 0 0 228 92 L114 92 A25 25 0 0 0 64 92 L34 92 Z"
              stroke={SIGNAL}
              strokeWidth="2.5"
            />
            <path d="M128 56 L160 36 L196 36 L196 56 Z" stroke={SIGNAL} strokeWidth="1.5" />
            <path d="M204 36 L230 36 Q239 37 244 43 L254 56 L204 56 Z" stroke={SIGNAL} strokeWidth="1.5" />
            <path d="M158 27 H238" stroke={SIGNAL} strokeWidth="2" />
            <circle cx="89" cy="94" r="18" stroke={SIGNAL} strokeWidth="2.5" fill={ASPHALTE} />
            <circle cx="253" cy="94" r="18" stroke={SIGNAL} strokeWidth="2.5" fill={ASPHALTE} />
            <circle cx="89" cy="94" r="6" stroke={SIGNAL} strokeWidth="1.5" />
            <circle cx="253" cy="94" r="6" stroke={SIGNAL} strokeWidth="1.5" />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexDirection: rtl ? "row-reverse" : "row",
            justifyContent: rtl ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: BITUME,
              border: `1px solid rgba(244,245,240,0.2)`,
              padding: "18px 26px",
            }}
          >
            {showLocalText && (
              <div style={{ fontSize: 18, color: INK2, letterSpacing: 2 }}>
                {priceLabel.toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: 40, fontWeight: 700, color: SIGNAL }}>
              169 900 DH
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 44,
              color: INK2,
            }}
          >
            {rtl ? "←" : "→"}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: BITUME,
              border: `1px solid ${JAUNE}`,
              padding: "18px 26px",
            }}
          >
            {showLocalText && (
              <div style={{ fontSize: 18, color: JAUNE, letterSpacing: 2 }}>
                {trueLabel.toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: 40, fontWeight: 700, color: JAUNE }}>
              4 870 DH
            </div>
          </div>
        </div>
      </div>
    )

  const options = {
    ...size,
    fonts: displayFonts.length
      ? displayFonts.map((data) => ({
          name: displayFamily,
          data,
          weight: 700 as const,
          style: "normal" as const,
        }))
      : undefined,
  }

  // Render eagerly so satori failures (e.g. an Arabic shaping edge case) are
  // catchable — the share card must never 500. Fallback: brand + numbers.
  try {
    const buf = await new ImageResponse(card(wantLocalText), options).arrayBuffer()
    return new Response(buf, { headers: { "content-type": contentType } })
  } catch {
    const buf = await new ImageResponse(card(false), options).arrayBuffer()
    return new Response(buf, { headers: { "content-type": contentType } })
  }
}
