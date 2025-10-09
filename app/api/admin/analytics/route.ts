import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { telegramLogger } from "@/lib/telegram-logger"
import { config } from "@/lib/config"

function isAdmin(userId: number | undefined): boolean {
    if (config.app.isDevelopment) {
        telegramLogger.debug(`Development mode - bypassing admin ID check.`, "admin/analytics/isAdmin")
        return true
    }
    const result = userId !== undefined && config.app.adminChatIds.includes(userId)
    telegramLogger.debug(
        `isAdmin check: User ID ${userId}, Admin IDs: ${JSON.stringify(config.app.adminChatIds)}, Result: ${result}`,
        "admin/analytics/isAdmin",
    )
    return result
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const adminUserId = Number(searchParams.get("adminUserId"))

    telegramLogger.debug(`Admin analytics GET by ${adminUserId}`, "admin/analytics/GET")

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(`Unauthorized access to admin analytics by ${adminUserId}`, "admin/analytics/GET")
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    try {
        // Summary counters
        const [{ rows: ordersCountRows }, { rows: revenueTotalRows }, { rows: revenue7Rows }] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS count FROM orders`),
            pool.query(`SELECT COALESCE(SUM(total_amount), 0)::numeric AS total FROM orders WHERE status <> 'cancelled'`),
            pool.query(
                `SELECT COALESCE(SUM(total_amount), 0)::numeric AS total FROM orders WHERE status <> 'cancelled' AND created_at >= NOW() - INTERVAL '7 days'`,
            ),
        ])

        const ordersByStatus = await pool.query<{ status: string; count: number }>(
            `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY status ASC`,
        )

        const [{ rows: productsCountRows }, { rows: activeProductsCountRows }, { rows: usersCountRows }] =
            await Promise.all([
                pool.query(`SELECT COUNT(*)::int AS count FROM products`),
                pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE is_available = true`),
                pool.query(`SELECT COUNT(*)::int AS count FROM users`),
            ])

        const topProducts = await pool.query(
            `SELECT p.id, p.name, COALESCE(SUM(oi.quantity),0)::int AS quantity, COALESCE(SUM(oi.price * oi.quantity),0)::numeric AS revenue
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             GROUP BY p.id, p.name
             ORDER BY quantity DESC
             LIMIT 5`,
        )

        const ordersPerDay = await pool.query(
            `WITH days AS (
                SELECT generate_series(CURRENT_DATE - INTERVAL '13 day', CURRENT_DATE, INTERVAL '1 day')::date AS day
            )
            SELECT d.day, COALESCE(COUNT(o.id), 0)::int AS count
            FROM days d
            LEFT JOIN orders o ON DATE(o.created_at) = d.day
            GROUP BY d.day
            ORDER BY d.day ASC`,
        )

        return NextResponse.json({
            totals: {
                orders: ordersCountRows[0]?.count ?? 0,
                revenueTotal: revenueTotalRows[0]?.total ?? 0,
                revenueLast7Days: revenue7Rows[0]?.total ?? 0,
                products: productsCountRows[0]?.count ?? 0,
                activeProducts: activeProductsCountRows[0]?.count ?? 0,
                users: usersCountRows[0]?.count ?? 0,
            },
            ordersByStatus: ordersByStatus.rows,
            topProducts: topProducts.rows,
            ordersPerDay: ordersPerDay.rows,
        })
    } catch (error: any) {
        telegramLogger.error(`Failed to fetch admin analytics: ${error.message}`, "admin/analytics/GET")
        return NextResponse.json({ error: "Failed to fetch analytics", details: error.message }, { status: 500 })
    }
}
