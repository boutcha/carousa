import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

/* The pocket guichet: on phones the main CTA rides the bottom edge.
   Hidden on md+ where the hero form is always within reach. */
export function MobileCta({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-signal/15 bg-asphalte/95 px-4 pt-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href={`/${locale}/trouver`}
        className="flex items-center justify-center border border-rouge bg-rouge px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wider text-signal transition-all active:translate-y-px"
      >
        {dict.header.cta}
      </Link>
    </div>
  )
}
