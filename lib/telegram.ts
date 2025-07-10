import crypto from "crypto"

export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get("hash")
    urlParams.delete("hash")

    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n")

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    return calculatedHash === hash
}

export function parseTelegramInitData(initData: string) {
    const urlParams = new URLSearchParams(initData)
    const user = urlParams.get("user")

    if (user) {
        return JSON.parse(decodeURIComponent(user))
    }

    return null
}
