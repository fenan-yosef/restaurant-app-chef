"use client"

import { useEffect, useState } from "react"
import type { TelegramWebApp, TelegramUser } from "@/lib/types"

export function useTelegram() {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const app = window.Telegram?.WebApp
        if (app) {
            app.ready()
            app.expand()
            setWebApp(app)
            setUser(app.initDataUnsafe.user || null)
        }
        setIsLoading(false)
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
