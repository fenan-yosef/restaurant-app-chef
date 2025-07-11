import { config } from "./config"

type LogLevel = "info" | "warn" | "error" | "debug"

interface TelegramLoggerOptions {
    level?: LogLevel
    context?: string
}

class TelegramLogger {
    private botToken: string | undefined
    private chatId: string | undefined
    private isEnabled: boolean

    constructor() {
        // Use values from the resolved config object
        this.botToken = config.telegram.botToken
        this.chatId = config.telegram.logChatId
        this.isEnabled = config.features.enableLogging && !!this.botToken && !!this.chatId

        if (!this.isEnabled && config.ui.showDebugInfo) {
            console.warn("Telegram logging is disabled. Check enableLogging, TELEGRAM_BOT_TOKEN, and TELEGRAM_LOG_CHAT_ID.")
        }
    }

    /**
     * Sends the already-formatted message either
     *   • directly to Telegram (server / Node runtime)
     *   • or through our /api/telegram-log proxy (browser)
     */
    private async sendToTelegram(message: string) {
        if (!this.isEnabled) return

        // ---------- 1. Running on the SERVER ----------
        if (typeof window === "undefined") {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: this.chatId,
                        text: message,
                        parse_mode: "MarkdownV2",
                    }),
                })

                if (!res.ok) {
                    const data = await res.json()
                    console.error("Failed to send log to Telegram (server):", res.status, data)
                }
            } catch (err) {
                console.error("Server-side Telegram log error:", err)
            }
            return
        }

        // ---------- 2. Running in the BROWSER ----------
        try {
            await fetch("/api/telegram-log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: message }),
                // no-cors not needed because same-origin
            })
        } catch (err) {
            console.error("Client-side proxy log error:", err)
        }
    }

    private formatMessage(message: string, level: LogLevel, context?: string): string {
        const timestamp = new Date().toISOString()
        const levelEmoji = {
            info: "ℹ️",
            warn: "⚠️",
            error: "❌",
            debug: "🐛",
        }[level]

        // Escape MarkdownV2 special characters
        const escapeMarkdownV2 = (text: string) => {
            return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1")
        }

        const escapedMessage = escapeMarkdownV2(message)
        const escapedContext = context ? ` \$$${escapeMarkdownV2(context)}\$$` : "" // Escaped parentheses

        return `\`${timestamp}\` ${levelEmoji} *${level.toUpperCase()}*${escapedContext}: ${escapedMessage}`
    }

    log(message: string, options?: TelegramLoggerOptions) {
        if (config.ui.showDebugInfo) {
            console.log(
                `[TelegramLogger] ${options?.level || "INFO"}: ${message}`,
                options?.context ? `(${options.context})` : "",
            )
        }
        this.sendToTelegram(this.formatMessage(message, options?.level || "info", options?.context))
    }

    info(message: string, context?: string) {
        this.log(message, { level: "info", context })
    }

    warn(message: string, context?: string) {
        this.log(message, { level: "warn", context })
    }

    error(message: string, context?: string) {
        this.log(message, { level: "error", context })
    }

    debug(message: string, context?: string) {
        if (config.ui.showDebugInfo) {
            // Only send debug logs if debug info is enabled
            this.log(message, { level: "debug", context })
        }
    }
}

export const telegramLogger = new TelegramLogger()
