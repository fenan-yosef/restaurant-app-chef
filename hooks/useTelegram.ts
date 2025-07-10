"use client"

import { useEffect, useState } from "react"
import type { TelegramWebApp, TelegramUser } from "@/lib/types"

export function useTelegram() {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check if we're in Telegram environment
        if (typeof window !== "undefined") {
            // Wait for Telegram script to load
            const checkTelegram = () => {
                if (window.Telegram?.WebApp) {
                    const app = window.Telegram.WebApp
                    console.log("Telegram WebApp found:", app)

                    app.ready()
                    app.expand()

                    setWebApp(app)
                    setUser(app.initDataUnsafe.user || null)

                    console.log("Telegram user:", app.initDataUnsafe.user)
                    console.log("Init data:", app.initData)
                } else {
                    console.log("Telegram WebApp not found, retrying...")
                    // Retry after a short delay
                    setTimeout(checkTelegram, 100)
                }
                setIsLoading(false)
            }

            // Start checking immediately and also after a delay
            checkTelegram()
            setTimeout(checkTelegram, 500)
        }
    }, [])

    const showMainButton = (text: string, onClick: () => void) => {
        if (webApp?.MainButton) {
            webApp.MainButton.setText(text)
            webApp.MainButton.onClick(onClick)
            webApp.MainButton.show()
        }
    }

    const hideMainButton = () => {
        webApp?.MainButton.hide()
    }

    const showBackButton = (onClick: () => void) => {
        if (webApp?.BackButton) {
            webApp.BackButton.onClick(onClick)
            webApp.BackButton.show()
        }
    }

    const hideBackButton = () => {
        webApp?.BackButton.hide()
    }

    const hapticFeedback = (type: "light" | "medium" | "heavy" | "success" | "error" | "warning") => {
        if (webApp?.HapticFeedback) {
            if (["success", "error", "warning"].includes(type)) {
                webApp.HapticFeedback.notificationOccurred(type as "success" | "error" | "warning")
            } else {
                webApp.HapticFeedback.impactOccurred(type as "light" | "medium" | "heavy")
            }
        }
    }

    const close = () => {
        webApp?.close()
    }

    return {
        webApp,
        user,
        isLoading,
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        hapticFeedback,
        close,
    }
}
