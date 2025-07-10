"use client"

import { useState, useEffect } from "react"
import type { TelegramUser } from "@/lib/types"
import { useTelegram } from "./useTelegram"

export function useAuth() {
    const { webApp, user: telegramUser, isLoading: telegramLoading } = useTelegram()
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const authenticate = async () => {
            console.log("Starting authentication...")
            console.log("WebApp:", webApp)
            console.log("Telegram User:", telegramUser)

            // If we're in development or if Telegram user exists
            if (telegramUser || process.env.NODE_ENV === "development") {
                try {
                    // In development, create a mock user if no Telegram user
                    const userToAuth = telegramUser || {
                        id: 12345,
                        first_name: "Test User",
                        last_name: "Dev",
                        username: "testuser",
                    }

                    if (webApp?.initData) {
                        // Try to authenticate with Telegram
                        const response = await fetch("/api/auth/telegram", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                initData: webApp.initData,
                            }),
                        })

                        if (response.ok) {
                            const data = await response.json()
                            setUser(data.user)
                            setIsAuthenticated(true)
                            console.log("Authenticated successfully:", data.user)
                        } else {
                            console.log("Auth failed, using fallback")
                            // Fallback for development
                            setUser(userToAuth)
                            setIsAuthenticated(true)
                        }
                    } else {
                        console.log("No initData, using fallback user")
                        // Fallback authentication
                        setUser(userToAuth)
                        setIsAuthenticated(true)
                    }
                } catch (error) {
                    console.error("Authentication error:", error)
                    // Fallback for development
                    if (process.env.NODE_ENV === "development") {
                        setUser({
                            id: 12345,
                            first_name: "Test User",
                            last_name: "Dev",
                            username: "testuser",
                        })
                        setIsAuthenticated(true)
                    }
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
