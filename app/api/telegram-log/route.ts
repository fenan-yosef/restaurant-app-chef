import { type NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"

/**
 * POST /api/telegram-log
 * Body: { text: string }
 *
 * Proxies the message to the Telegram Bot API from the **server** so that
 * the browser never talks to Telegram directly (avoids CORS).
 */
export async function POST(req: NextRequest) {
    try {
        const { text } = (await req.json()) as { text?: string }

        if (!text) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 })
        }

        const botToken = config.telegram.botToken
        const chatId = config.telegram.logChatId

        if (!botToken || !chatId) {
            return NextResponse.json({ error: "Telegram logging not configured" }, { status: 500 })
        }

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "MarkdownV2",
            }),
        })

        if (!tgRes.ok) {
            const data = await tgRes.json()
            return NextResponse.json({ error: data }, { status: tgRes.status })
        }

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
