import type { Metadata, Viewport } from "next"
import {
  Archivo,
  B612_Mono,
  Big_Shoulders,
  Big_Shoulders_Stencil,
  Noto_Kufi_Arabic,
  Tajawal,
} from "next/font/google"
import { isRtl, locales, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { AnalyticsProvider } from "@/components/posthog-provider"
import "../globals.css"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const OG_LOCALES: Record<Locale, string> = {
  fr: "fr_MA",
  ar: "ar_MA",
  en: "en_US",
}

const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bigshoulders",
})

const bigShouldersStencil = Big_Shoulders_Stencil({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-stencil-latin",
})

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
})

const b612Mono = B612_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-b612",
})

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-kufi",
})

const tajawal = Tajawal({
  weight: ["400", "500", "700"],
  subsets: ["arabic"],
  variable: "--font-tajawal",
})

export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const dict = await getDictionary(locale)
  return {
    metadataBase: new URL(SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: "/fr",
        ar: "/ar",
        en: "/en",
        "x-default": "/fr",
      },
    },
    openGraph: {
      type: "website",
      siteName: "Carsablanca",
      title: dict.meta.title,
      description: dict.meta.description,
      url: `/${locale}`,
      locale: OG_LOCALES[locale],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  }
}

export const viewport: Viewport = {
  // Tarmac chrome on mobile browsers instead of default white bars.
  themeColor: "#15171c",
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const locale = (await params).locale as Locale
  const dict = await getDictionary(locale)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Carsablanca",
    url: `${SITE_URL}/${locale}`,
    description: dict.meta.description,
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: "Carsablanca",
      url: SITE_URL,
    },
  }

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${bigShoulders.variable} ${bigShouldersStencil.variable} ${archivo.variable} ${b612Mono.variable} ${notoKufi.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-svh flex-col bg-background font-sans text-foreground">
        <AnalyticsProvider locale={locale}>{children}</AnalyticsProvider>
        <script
          type="application/ld+json"
          // first-party strings only; <-escape guards against </script> breakout
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  )
}
