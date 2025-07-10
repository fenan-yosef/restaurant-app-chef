import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { validateTelegramWebAppData, parseTelegramInitData } from "@/lib/telegram"

export async function POST(request: NextRequest) {
    try {
        const { initData } = await request.json()

        if (!initData) {
            return NextResponse.json({ error: "Missing initData" }, { status: 400 })
        }

        // Validate Telegram data
        const isValid = validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)
        if (!isValid) {
            return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 })
        }

        // Parse user data
        const userData = parseTelegramInitData(initData)
        if (!userData) {
            return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
        }

        // Upsert user in database
        const query = `
      INSERT INTO users (id, first_name, last_name, username, language_code, is_premium, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        language_code = EXCLUDED.language_code,
        is_premium = EXCLUDED.is_premium,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

        const values = [
            userData.id,
            userData.first_name,
            userData.last_name || null,
            userData.username || null,
            userData.language_code || null,
            userData.is_premium || false,
        ]

        const result = await pool.query(query, values)
        const user = result.rows[0]

        return NextResponse.json({ user, success: true })
    } catch (error) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }
}
