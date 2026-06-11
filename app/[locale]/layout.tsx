import type { Metadata } from "next"
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
import "../globals.css"

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
      className={`${bigShoulders.variable} ${bigShouldersStencil.variable} ${archivo.variable} ${b612Mono.variable} ${notoKufi.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-svh flex-col bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  )
}
