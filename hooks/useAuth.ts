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
                // 1) If mockMode is enabled, use the mock user (development)
                if (config.telegram.mockMode) {
                    // Use mock authentication in development
                    telegramLogger.debug("Attempting mock authentication...", "useAuth")
                    const result = await apiClient.authenticateUser("")
                    setUser(result.user)
                    setIsAuthenticated(true)
                    telegramLogger.info(`Mock authentication successful: ${result.user.id}`, "useAuth")
                    // 2) If Telegram WebApp data is present, use real Telegram authentication
                } else if (telegramUser && webApp?.initData) {
                    // Use real Telegram authentication in production
                    telegramLogger.debug("Attempting real Telegram authentication...", "useAuth")
                    const result = await apiClient.authenticateUser(webApp.initData)
                    setUser(result.user)
                    setIsAuthenticated(true)
                    telegramLogger.info(`Telegram authentication successful: ${result.user.id}`, "useAuth")
                } else {
                    telegramLogger.warn("Not enough data for real Telegram authentication (missing user or initData).", "useAuth")

                    // 3) Browser fallback: if the URL contains ?guest=1 allow a guest/browser session
                    try {
                        if (typeof window !== "undefined") {
                            const params = new URLSearchParams(window.location.search)
                            const guestParam = params.get("guest")
                            if (guestParam === "1" || guestParam === "true") {
                                const guestUser: any = {
                                    id: Date.now() * -1,
                                    first_name: "Guest",
                                    username: null,
                                    language_code: "en",
                                }
                                setUser(guestUser)
                                setIsAuthenticated(true)
                                telegramLogger.info("Guest/browser authentication enabled via URL param.", "useAuth")
                                setIsLoading(false)
                                return
                            }
                        }

                        // Fallback to mock user if in development
                        if (config.app.isDevelopment) {
                            setUser({ ...config.telegram.mockUser, photo_url: "" })
                            setIsAuthenticated(true)
                            telegramLogger.warn("Falling back to development mock user.", "useAuth")
                        } else {
                            telegramLogger.error(
                                "Authentication failed: Not in Telegram environment or missing initData in production.",
                                "useAuth",
                            )
                        }
                    } catch (err: any) {
                        telegramLogger.error(`Browser fallback error: ${err?.message || err}`, "useAuth")
                    }
                }
            } catch (error: any) {
                telegramLogger.error(`Authentication failed: ${error.message}`, "useAuth")

                // Fallback to mock user in development
                if (config.app.isDevelopment) {
                    setUser({ ...config.telegram.mockUser, photo_url: '' })
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
