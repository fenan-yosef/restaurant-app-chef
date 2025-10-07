import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import TelegramScript from "@/components/TelegramScript"
import { config, logConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata = {
  title: "Chef Figoz Bakery",
  description: "Delicious pastries and cakes delivered to your door.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Log configuration on the server side (during build/SSR)
  // This will only run once per request on the server.
  // For client-side debug info, check individual components.
  if (config.ui.showDebugInfo) {
    logConfig()
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative min-h-screen overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 -z-10"
            >
              <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100 via-white to-rose-100 blur-3xl opacity-80 dark:from-blue-500/10 dark:via-slate-900 dark:to-fuchsia-500/10" />
              <div className="absolute inset-0 bg-grid dark:bg-grid-dark" />
              <div className="absolute bottom-[-12rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-sky-200 via-white to-purple-100 blur-3xl opacity-70 dark:from-sky-500/15 dark:via-slate-900 dark:to-purple-500/15" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">
              {children}
            </div>
          </div>
          <TelegramScript />
        </ThemeProvider>
      </body>
    </html>
  )
}
