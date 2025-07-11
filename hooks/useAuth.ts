"use client"

import { useState, useEffect } from "react"
import type { TelegramUser } from "@/lib/types"
import { useTelegram } from "./useTelegram"
import { apiClient } from "@/lib/api-client"
import { config } from "@/lib/config"

export function useAuth() {
    const { webApp, user: telegramUser, isLoading: telegramLoading } = useTelegram()
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const authenticate = async () => {
            if (config.ui.showDebugInfo) {
                console.log("🔐 Starting authentication...")
                console.log("Telegram Mock Mode:", config.telegram.mockMode)
                console.log("Telegram User:", telegramUser)
            }

            try {
                if (config.telegram.mockMode) {
                    // Use mock authentication in development
                    const result = await apiClient.authenticateUser("")
                    setUser(result.user)
                    setIsAuthenticated(true)

                    if (config.ui.showDebugInfo) {
                        console.log("✅ Mock authentication successful:", result.user)
                    }
                } else if (telegramUser && webApp?.initData) {
                    // Use real Telegram authentication in production
                    const result = await apiClient.authenticateUser(webApp.initData)
                    setUser(result.user)
                    setIsAuthenticated(true)

                    if (config.ui.showDebugInfo) {
                        console.log("✅ Telegram authentication successful:", result.user)
                    }
                }
            } catch (error) {
                console.error("❌ Authentication failed:", error)

                // Fallback to mock user in development
                if (config.app.isDevelopment) {
                    setUser(config.telegram.mockUser)
                    setIsAuthenticated(true)
                    console.log("🔄 Using fallback mock user")
                }
            }

            setIsLoading(false)
        }

        if (!telegramLoading) {
            authenticate()
        }
    }, [webApp, telegramUser, telegramLoading])

    return { user, isAuthenticated, isLoading: isLoading || telegramLoading }
}
