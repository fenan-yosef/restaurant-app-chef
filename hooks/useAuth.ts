"use client"

import { useState, useEffect } from "react"
import type { TelegramUser } from "@/lib/types"
import { useTelegram } from "./useTelegram"

export function useAuth() {
    const { webApp, user: telegramUser } = useTelegram()
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const authenticate = async () => {
            if (webApp && telegramUser) {
                try {
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
                    }
                } catch (error) {
                    console.error("Authentication error:", error)
                }
            }
            setIsLoading(false)
        }

        authenticate()
    }, [webApp, telegramUser])

    return { user, isAuthenticated, isLoading }
}
