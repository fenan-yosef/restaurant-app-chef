import crypto from "crypto"

export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
    try {
        if (!initData || !botToken) {
            console.log("Missing initData or botToken")
            return false
        }

        const urlParams = new URLSearchParams(initData)
        const hash = urlParams.get("hash")

        if (!hash) {
            console.log("No hash found in initData")
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
        console.log("Validation result:", isValid)
        return isValid
    } catch (error) {
        console.error("Validation error:", error)
        return false
    }
}

export function parseTelegramInitData(initData: string) {
    try {
        const urlParams = new URLSearchParams(initData)
        const user = urlParams.get("user")

        if (user) {
            return JSON.parse(decodeURIComponent(user))
        }

        return null
    } catch (error) {
        console.error("Parse error:", error)
        return null
    }
}
