"use client"

import { useEffect } from "react"
import { config, logConfig } from "@/lib/config"

export default function TelegramScript() {
    useEffect(() => {
        // Log configuration in development
        logConfig()

        // Load Telegram Web App script
        const script = document.createElement("script")
        script.src = "https://telegram.org/js/telegram-web-app.js"
        script.async = true

        script.onload = () => {
            console.log("✅ Telegram Web App script loaded")

            if (config.ui.showDebugInfo) {
                console.log("Telegram WebApp available:", !!window.Telegram?.WebApp)
                if (window.Telegram?.WebApp) {
                    console.log("WebApp version:", window.Telegram.WebApp.version)
                    console.log("WebApp platform:", window.Telegram.WebApp.platform)
                }
            }
        }

        script.onerror = () => {
            console.error("❌ Failed to load Telegram Web App script")
        }

        document.head.appendChild(script)

        return () => {
            // Cleanup
            if (document.head.contains(script)) {
                document.head.removeChild(script)
            }
        }
    }, [])

    return null
}
