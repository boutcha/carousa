import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { SiteHeader } from "@/components/landing/site-header"
import { Hero } from "@/components/landing/hero"
import { TrustStrip } from "@/components/landing/trust-strip"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CostGrid } from "@/components/landing/cost-grid"
import { NewVsUsed } from "@/components/landing/new-vs-used"
import { Roadmap } from "@/components/landing/roadmap"
import { SiteFooter } from "@/components/landing/site-footer"

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = (await params).locale as Locale
  const dict = await getDictionary(locale)

  return (
    <>
      <SiteHeader dict={dict} locale={locale} />
      <main>
        <Hero dict={dict} locale={locale} />
        <TrustStrip dict={dict} />
        <HowItWorks dict={dict} />
        <CostGrid dict={dict} />
        <NewVsUsed dict={dict} />
        <Roadmap dict={dict} />
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </>
  )
}
