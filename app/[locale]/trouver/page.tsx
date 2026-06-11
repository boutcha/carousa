import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/site-footer"

export default async function TrouverPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = (await params).locale as Locale
  const dict = await getDictionary(locale)
  const t = dict.stub

  return (
    <>
      <SiteHeader dict={dict} locale={locale} />
      <main className="tarmac relative flex flex-1 items-center justify-center overflow-hidden bg-asphalte px-6 py-24">
        <div className="plate relative w-full max-w-lg bg-bitume p-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-jaune">
            {t.kicker}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-signal rtl:leading-[1.25] rtl:tracking-normal">
            {t.title}
          </h1>
          <p className="mt-4 leading-relaxed text-ink-2-dark">{t.body}</p>
          <div className="mt-7 flex items-center justify-center gap-2">
            {t.steps.map((step, i) => (
              <span
                key={step}
                className="border border-signal/25 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-signal/75"
              >
                PK {i + 1} · {step}
              </span>
            ))}
          </div>
          <Link
            href={`/${locale}`}
            className="mt-9 inline-flex border border-rouge bg-rouge px-6 py-3 font-display text-base font-bold uppercase tracking-wider text-signal transition-all hover:bg-rouge/90 active:translate-y-px"
          >
            {t.back}
          </Link>
        </div>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </>
  )
}
