import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import TelegramScript from "@/components/TelegramScript"
import { ThemeProvider } from "@/components/ThemeProvider"
import { config } from "@/lib/config"
import { telegramLogger } from "@/lib/telegram-logger" // Import the logger

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
  // Log app startup and initial config status (server-side)
  telegramLogger.info("Application RootLayout initialized", "AppStartup")
  telegramLogger.debug(`Server-side config.features.enableLogging: ${config.features.enableLogging}`, "AppStartup")
  telegramLogger.debug(
    `Server-side config.telegram.logChatId: ${config.telegram.logChatId ? "Present" : "Missing"}`,
    "AppStartup",
  )
  telegramLogger.debug(
    `Server-side config.telegram.botToken: ${config.telegram.botToken ? "Present" : "Missing"}`,
    "AppStartup",
  )

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
