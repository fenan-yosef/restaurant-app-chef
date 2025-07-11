import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import TelegramScript from "@/components/TelegramScript"
import { ThemeProvider } from "@/components/ThemeProvider"
import { config } from "@/lib/config"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: config.app.name,
  description: "Fresh bakery products delivered to your door with advanced search and modern UI",
  keywords: ["bakery", "cakes", "pastries", "delivery", "telegram", "mini app"],
  authors: [{ name: "Chef Figoz Bakery" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <TelegramScript />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
