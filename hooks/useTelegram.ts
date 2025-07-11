"use client"

import { useEffect, useState } from "react"
import type { TelegramWebApp, TelegramUser } from "@/lib/types"
import { telegramLogger } from "@/lib/telegram-logger" // Import the logger

export function useTelegram() {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        telegramLogger.debug("useTelegram hook mounted", "useTelegram")

        // Check if we're in Telegram environment
        if (typeof window !== "undefined") {
            telegramLogger.debug("Window object available, checking for Telegram WebApp...", "useTelegram")

            const checkTelegram = () => {
                if (window.Telegram?.WebApp) {
                    const app = window.Telegram.WebApp
                    telegramLogger.info("Telegram WebApp found and ready.", "useTelegram")

                    app.ready()
                    app.expand()

                    setWebApp(app)
                    setUser(app.initDataUnsafe.user || null)

                    telegramLogger.debug(`Telegram user: ${JSON.stringify(app.initDataUnsafe.user)}`, "useTelegram")
                    telegramLogger.debug(`Init data: ${app.initData ? "Present" : "Missing"}`, "useTelegram")
                    if (!app.initData) {
                        telegramLogger.warn("Telegram WebApp initData is missing!", "useTelegram")
                    }
                } else {
                    telegramLogger.debug("Telegram WebApp not found, retrying...", "useTelegram")
                    // Retry after a short delay
                    setTimeout(checkTelegram, 100)
                }
                setIsLoading(false)
            }

            // Start checking immediately and also after a delay
            checkTelegram()
            setTimeout(checkTelegram, 500)
        } else {
            telegramLogger.warn(
                "Window object not available (server-side render?), skipping Telegram WebApp check.",
                "useTelegram",
            )
            setIsLoading(false)
        }
    }, [])

    const showMainButton = (text: string, onClick: () => void) => {
        if (webApp?.MainButton) {
            webApp.MainButton.setText(text)
            webApp.MainButton.onClick(onClick)
            webApp.MainButton.show()
            telegramLogger.debug(`MainButton shown: ${text}`, "useTelegram")
        }
    }

    const hideMainButton = () => {
        webApp?.MainButton.hide()
        telegramLogger.debug("MainButton hidden", "useTelegram")
    }

    const showBackButton = (onClick: () => void) => {
        if (webApp?.BackButton) {
            webApp.BackButton.onClick(onClick)
            webApp.BackButton.show()
            telegramLogger.debug("BackButton shown", "useTelegram")
        }
    }

    const hideBackButton = () => {
        webApp?.BackButton.hide()
        telegramLogger.debug("BackButton hidden", "useTelegram")
    }

    const hapticFeedback = (type: "light" | "medium" | "heavy" | "success" | "error" | "warning") => {
        if (webApp?.HapticFeedback) {
            if (["success", "error", "warning"].includes(type)) {
                webApp.HapticFeedback.notificationOccurred(type as "success" | "error" | "warning")
            } else {
                webApp.HapticFeedback.impactOccurred(type as "light" | "medium" | "heavy")
            }
            telegramLogger.debug(`Haptic feedback: ${type}`, "useTelegram")
        }
    }

    const close = () => {
        webApp?.close()
        telegramLogger.info("Telegram WebApp closed", "useTelegram")
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
