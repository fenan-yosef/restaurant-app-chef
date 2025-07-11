"use client"

import { useEffect } from "react"
import { config, logConfig } from "@/lib/config"
import { telegramLogger } from "@/lib/telegram-logger" // Import the logger

export default function TelegramScript() {
    useEffect(() => {
        // Log configuration in development
        logConfig()
        console.log("TelegramScript log: Config object:", config)
        telegramLogger.debug(`Telegram logging enabled: ${config.features.enableLogging}`, "TelegramScript")
        telegramLogger.debug(`Debug info enabled: ${config.ui.showDebugInfo}`, "TelegramScript")
        telegramLogger.debug(`Client-side telegramLogger.isEnabled: ${telegramLogger["isEnabled"]}`, "TelegramScript") // Access private property for debug
        telegramLogger.debug(
            `Client-side config.telegram.logChatId: ${config.telegram.logChatId ? "Present" : "Missing"}`,
            "TelegramScript",
        )

        // Load Telegram Web App script
        const script = document.createElement("script")
        script.src = "https://telegram.org/js/telegram-web-app.js"
        script.async = true

        script.onload = () => {
            console.log("✅ Telegram Web App script loaded")
            telegramLogger.info("Telegram Web App script loaded successfully.", "TelegramScript")

            if (config.ui.showDebugInfo) {
                console.log("Telegram WebApp available:", !!window.Telegram?.WebApp)
                if (window.Telegram?.WebApp) {
                    console.log("WebApp version:", window.Telegram.WebApp.version)
                    console.log("WebApp platform:", window.Telegram.WebApp.platform)
                    telegramLogger.debug(`WebApp version: ${window.Telegram.WebApp.version}`, "TelegramScript")
                    telegramLogger.debug(`WebApp platform: ${window.Telegram.WebApp.platform}`, "TelegramScript")
                }
            }
        }

        script.onerror = () => {
            console.error("❌ Failed to load Telegram Web App script")
            telegramLogger.error("Failed to load Telegram Web App script.", "TelegramScript")
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
