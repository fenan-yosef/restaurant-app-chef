import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { telegramLogger } from "@/lib/telegram-logger"
import { config } from "@/lib/config"

// Helper to check if a user is an admin
function isAdmin(userId: number | undefined): boolean {
    // Allow access in development for easier local testing
    if (config.app.isDevelopment) {
        telegramLogger.debug(`Development mode detected - bypassing admin ID check.`, "admin/users/isAdmin")
        return true
    }

    const result = userId !== undefined && config.app.adminChatIds.includes(userId)
    telegramLogger.debug(
        `isAdmin check: User ID ${userId}, Admin IDs: ${JSON.stringify(config.app.adminChatIds)}, Result: ${result}`,
        "admin/users/isAdmin",
    )
    return result
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const adminUserId = Number(searchParams.get("adminUserId"))

    // Server-side logging for debugging
    telegramLogger.debug(`Admin users GET: Received adminUserId: ${adminUserId}`, "admin/users/GET")

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(`Unauthorized access attempt to admin users GET by user ID: ${adminUserId}`, "admin/users/GET")
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(`Admin users GET request by user ID: ${adminUserId}`, "admin/users/GET")

    const query = `
    SELECT id, first_name, last_name, username, language_code, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `
    try {
        const result = await pool.query(query)
        return NextResponse.json(result.rows)
    } catch (error: any) {
        telegramLogger.error(`Failed to fetch admin users: ${error.message}`, "admin/users/GET")
        return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 })
    }
}
