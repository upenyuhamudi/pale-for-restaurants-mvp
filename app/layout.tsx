import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { AppProviders } from "@/components/providers/app-providers"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Palé For Restaurants MVP",
  description: "Modern dine-in ordering platform for restaurants",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  )
}
