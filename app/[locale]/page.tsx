import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { SiteHeader } from "@/components/landing/site-header"
import { Hero } from "@/components/landing/hero"
import { TrustStrip } from "@/components/landing/trust-strip"
import { Selection } from "@/components/landing/selection"
import { GrandLivre } from "@/components/landing/grand-livre"
import { Fourche } from "@/components/landing/fourche"
import { SiteFooter } from "@/components/landing/site-footer"
import { MobileCta } from "@/components/landing/mobile-cta"
import { ScrollReveals } from "@/components/landing/scroll-reveals"

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
        <Selection dict={dict} />
        <GrandLivre dict={dict} />
        <Fourche dict={dict} />
      </main>
      <SiteFooter dict={dict} locale={locale} />
      <MobileCta dict={dict} locale={locale} />
      <ScrollReveals />
    </>
  )
}
