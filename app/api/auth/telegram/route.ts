import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { validateTelegramWebAppData, parseTelegramInitData } from "@/lib/telegram"
import { telegramLogger } from "@/lib/telegram-logger" // Import the logger
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
    telegramLogger.info("Auth request received", "api/auth/telegram")
    try {
        const { initData } = await request.json()

        telegramLogger.debug(`InitData received: ${initData ? "Present" : "Missing"}`, "api/auth/telegram")

        if (!initData) {
            telegramLogger.warn("No initData provided in auth request.", "api/auth/telegram")
            return NextResponse.json({ error: "Missing initData" }, { status: 400 })
        }

        // In development, skip validation
        if (config.app.isDevelopment) {
            telegramLogger.warn("Development mode detected - skipping Telegram initData validation.", "api/auth/telegram")

            const userData = parseTelegramInitData(initData)
            if (!userData) {
                telegramLogger.error("Failed to parse user data in development mode.", "api/auth/telegram")
                return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
            }

            // Create/update user in database
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

            telegramLogger.info(`User authenticated (dev mode): ${user.id}`, "api/auth/telegram")
            const resDev = NextResponse.json({ user, success: true })
            // set session cookie for subsequent requests
            resDev.cookies.set('session_user', String(user.id), { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30 })
            return resDev
        }

        // Production validation
        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            telegramLogger.error("TELEGRAM_BOT_TOKEN is not configured in production environment.", "api/auth/telegram")
            return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
        }

        // Validate Telegram data
        const isValid = validateTelegramWebAppData(initData, botToken)
        if (!isValid) {
            telegramLogger.error("Invalid Telegram data received during authentication.", "api/auth/telegram")
            return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 })
        }

        // Parse user data
        const userData = parseTelegramInitData(initData)
        if (!userData) {
            telegramLogger.error("Could not parse user data from valid initData.", "api/auth/telegram")
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

        telegramLogger.info(`User authenticated successfully: ${user.id}`, "api/auth/telegram")
        const res = NextResponse.json({ user, success: true })
        res.cookies.set('session_user', String(user.id), { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30 })
        return res
    } catch (error: any) {
        telegramLogger.error(`Authentication failed: ${error.message}`, "api/auth/telegram")
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }
}
