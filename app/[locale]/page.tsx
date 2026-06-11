import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { SiteHeader } from "@/components/landing/site-header"
import { Hero } from "@/components/landing/hero"
import { TrustStrip } from "@/components/landing/trust-strip"
import { Roadbook } from "@/components/landing/roadbook"
import { GrandLivre } from "@/components/landing/grand-livre"
import { Fourche } from "@/components/landing/fourche"
import { RoadmapBornes } from "@/components/landing/roadmap-bornes"
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
        <Roadbook dict={dict} />
        <GrandLivre dict={dict} />
        <Fourche dict={dict} />
        <RoadmapBornes dict={dict} />
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </>
  )
}
