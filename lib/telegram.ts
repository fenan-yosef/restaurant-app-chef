import crypto from "crypto"
import { telegramLogger } from "./telegram-logger" // Import the logger

export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
    telegramLogger.debug("Starting Telegram WebApp data validation...", "validateTelegramWebAppData")
    try {
        if (!initData || !botToken) {
            telegramLogger.warn("Missing initData or botToken for validation.", "validateTelegramWebAppData")
            return false
        }

        const urlParams = new URLSearchParams(initData)
        const hash = urlParams.get("hash")

        if (!hash) {
            telegramLogger.warn("No hash found in initData for validation.", "validateTelegramWebAppData")
            return false
        }

        urlParams.delete("hash")

        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n")

        const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
        const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

        const isValid = calculatedHash === hash
        telegramLogger.info(`Telegram WebApp data validation result: ${isValid}`, "validateTelegramWebAppData")
        if (!isValid) {
            telegramLogger.error(
                `Validation failed. Calculated hash: ${calculatedHash}, Provided hash: ${hash}`,
                "validateTelegramWebAppData",
            )
        }
        return isValid
    } catch (error: any) {
        telegramLogger.error(`Validation error: ${error.message}`, "validateTelegramWebAppData")
        return false
    }
}

export function parseTelegramInitData(initData: string) {
    telegramLogger.debug("Parsing Telegram initData...", "parseTelegramInitData")
    try {
        const urlParams = new URLSearchParams(initData)
        const user = urlParams.get("user")

        if (user) {
            const userData = JSON.parse(decodeURIComponent(user))
            telegramLogger.debug(`Parsed user data: ${JSON.stringify(userData)}`, "parseTelegramInitData")
            return userData
        }

        telegramLogger.warn("No user data found in initData.", "parseTelegramInitData")
        return null
    } catch (error: any) {
        telegramLogger.error(`Error parsing initData: ${error.message}`, "parseTelegramInitData")
        return null
    }
}
