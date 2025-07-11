"use client"

import { useState, useEffect } from "react"
import type { TelegramUser } from "@/lib/types"
import { useTelegram } from "./useTelegram"
import { apiClient } from "@/lib/api-client"
import { config } from "@/lib/config"
import { telegramLogger } from "@/lib/telegram-logger" // Import the logger

export function useAuth() {
    const { webApp, user: telegramUser, isLoading: telegramLoading } = useTelegram()
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const authenticate = async () => {
            telegramLogger.info("Starting authentication process...", "useAuth")
            telegramLogger.debug(`Telegram Mock Mode: ${config.telegram.mockMode}`, "useAuth")
            telegramLogger.debug(
                `Telegram User (from WebApp hook): ${telegramUser ? JSON.stringify(telegramUser) : "N/A"}`,
                "useAuth",
            )
            telegramLogger.debug(`WebApp initData: ${webApp?.initData ? "Present" : "N/A"}`, "useAuth")

            try {
                if (config.telegram.mockMode) {
                    // Use mock authentication in development
                    telegramLogger.debug("Attempting mock authentication...", "useAuth")
                    const result = await apiClient.authenticateUser("")
                    setUser(result.user)
                    setIsAuthenticated(true)
                    telegramLogger.info(`Mock authentication successful: ${result.user.id}`, "useAuth")
                } else if (telegramUser && webApp?.initData) {
                    // Use real Telegram authentication in production
                    telegramLogger.debug("Attempting real Telegram authentication...", "useAuth")
                    const result = await apiClient.authenticateUser(webApp.initData)
                    setUser(result.user)
                    setIsAuthenticated(true)
                    telegramLogger.info(`Telegram authentication successful: ${result.user.id}`, "useAuth")
                } else {
                    telegramLogger.warn("Not enough data for real Telegram authentication (missing user or initData).", "useAuth")
                    // Fallback to mock user if not in Telegram environment or data is missing
                    if (config.app.isDevelopment) {
                        setUser(config.telegram.mockUser)
                        setIsAuthenticated(true)
                        telegramLogger.warn("Falling back to development mock user.", "useAuth")
                    } else {
                        telegramLogger.error(
                            "Authentication failed: Not in Telegram environment or missing initData in production.",
                            "useAuth",
                        )
                    }
                }
            } catch (error: any) {
                telegramLogger.error(`Authentication failed: ${error.message}`, "useAuth")

                // Fallback to mock user in development
                if (config.app.isDevelopment) {
                    setUser(config.telegram.mockUser)
                    setIsAuthenticated(true)
                    telegramLogger.warn("Authentication failed, but using fallback mock user in development.", "useAuth")
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
