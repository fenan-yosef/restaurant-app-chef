import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { telegramLogger } from "@/lib/telegram-logger"
import { config } from "@/lib/config"

// Helper to check if a user is an admin
function isAdmin(userId: number | undefined): boolean {
    return userId !== undefined && config.app.adminChatIds.includes(userId)
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = Number(searchParams.get("adminUserId")) // User ID of the admin making the request

    if (!isAdmin(userId)) {
        telegramLogger.warn(`Unauthorized access attempt to admin orders GET by user ID: ${userId}`, "admin/orders/GET")
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(`Admin orders GET request by user ID: ${userId}`, "admin/orders/GET")

    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const search = searchParams.get("search")

    let query = `
    SELECT o.*, u.first_name AS user_first_name, u.username AS user_username,
      json_agg(
        json_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'price', oi.price,
          'product', json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'photos', p.photos
          )
        )
      ) AS items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE 1=1
  `
    const values: any[] = []
    let paramCount = 0

    if (status && status !== "all") {
        paramCount++
        query += ` AND o.status = $${paramCount}`
        values.push(status)
    }

    if (search) {
        paramCount++
        query += ` AND (
      o.id::text ILIKE $${paramCount} OR
      u.username ILIKE $${paramCount} OR
      u.first_name ILIKE $${paramCount} OR
      o.delivery_address ILIKE $${paramCount} OR
      o.phone_number ILIKE $${paramCount}
    )`
        values.push(`%${search}%`)
    }

    query += ` GROUP BY o.id, u.first_name, u.username`
    query += ` ORDER BY o.${sortBy} ${sortOrder === "asc" ? "ASC" : "DESC"}`

    try {
        const result = await pool.query(query, values)
        return NextResponse.json(result.rows)
    } catch (error: any) {
        telegramLogger.error(`Failed to fetch admin orders: ${error.message}`, "admin/orders/GET")
        return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const { orderId, status, adminUserId } = await request.json()

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(
            `Unauthorized access attempt to admin orders PUT by user ID: ${adminUserId}`,
            "admin/orders/PUT",
        )
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(
        `Admin orders PUT request for order ${orderId}, status ${status} by user ID: ${adminUserId}`,
        "admin/orders/PUT",
    )

    if (!orderId || !status) {
        return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const query = `
    UPDATE orders
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `
    try {
        const result = await pool.query(query, [status, orderId])
        if (result.rows.length === 0) {
            telegramLogger.warn(`Order ${orderId} not found for status update by user ID: ${adminUserId}`, "admin/orders/PUT")
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }
        telegramLogger.info(`Order ${orderId} status updated to ${status} by user ID: ${adminUserId}`, "admin/orders/PUT")
        return NextResponse.json(result.rows[0])
    } catch (error: any) {
        telegramLogger.error(`Failed to update order ${orderId} status: ${error.message}`, "admin/orders/PUT")
        return NextResponse.json({ error: "Failed to update order status", details: error.message }, { status: 500 })
    }
}
