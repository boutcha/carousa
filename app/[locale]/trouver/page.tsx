import Link from "next/link"
import { Button } from "@/components/ui/button"
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
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="sawtooth relative w-full max-w-lg rotate-[-0.8deg] rounded-t-lg border border-foreground/15 bg-card p-10 text-center shadow-offset">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta-deep">
            {t.kicker}
          </p>
          <h1 className="mt-4 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t.body}</p>
          <div className="mt-7 flex items-center justify-center gap-2">
            {t.steps.map((step, i) => (
              <span
                key={step}
                className="rounded-full border border-foreground/20 bg-secondary/60 px-3 py-1 font-mono text-xs text-foreground/70"
              >
                {i + 1} · {step}
              </span>
            ))}
          </div>
          <Button asChild className="mt-9">
            <Link href={`/${locale}`}>{t.back}</Link>
          </Button>
        </div>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </>
  )
}
