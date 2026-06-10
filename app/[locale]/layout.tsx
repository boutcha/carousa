import type { Metadata } from "next"
import {
  Fraunces,
  Readex_Pro,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google"
import { isRtl, locales, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import "../globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
})

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
})

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
})

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
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
    title: dict.meta.title,
    description: dict.meta.description,
  }
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const locale = (await params).locale as Locale

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${fraunces.variable} ${schibsted.variable} ${splineMono.variable} ${readex.variable} h-full antialiased`}
    >
      <body className="grain relative flex min-h-svh flex-col bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  )
}
