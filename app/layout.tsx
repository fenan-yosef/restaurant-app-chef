import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import TelegramScript from "@/components/TelegramScript"
import { config, logConfig } from "@/lib/config" // Import logConfig

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <TelegramScript />
        </ThemeProvider>
      </body>
    </html>
  )
}
