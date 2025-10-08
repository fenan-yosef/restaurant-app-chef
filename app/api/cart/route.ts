import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userIdParam = searchParams.get("userId")
        // Prefer session cookie for authenticated reads; fall back to userId query (for debugging/admin)
        let userId: number | null = null
        const cookieUser = request.cookies.get('session_user')
        if (cookieUser && cookieUser.value) {
            const v = Number(cookieUser.value)
            if (!Number.isNaN(v)) userId = v
        }
        if (!userId && userIdParam) {
            const parsed = Number(userIdParam)
            if (!Number.isNaN(parsed)) userId = parsed
        }
        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const query = `
      SELECT ci.*, p.name, p.description, p.price, p.photos, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `

        const result = await pool.query(query, [userId])
        return NextResponse.json(result.rows)
    } catch (error) {
        console.error("Cart fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const productId = body?.productId ?? body?.product_id
        const quantity = body?.quantity

        // Determine authenticated user from session cookie
        const cookieUser = request.cookies.get('session_user')
        if (!cookieUser || !cookieUser.value) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        const uid = Number(cookieUser.value)
        const pid = Number(productId)
        const qty = Number(quantity)

        if (Number.isNaN(uid) || Number.isNaN(pid) || Number.isNaN(qty)) {
            return NextResponse.json({ error: "Invalid numeric fields" }, { status: 400 })
        }

        // Do not allow guest/browser negative user IDs to write to server-side cart
        if (uid < 0) {
            return NextResponse.json({ error: "Guest browser sessions are local-only" }, { status: 403 })
        }

        // Ensure product exists
        const prodRes = await pool.query("SELECT id FROM products WHERE id = $1", [pid])
        if (!prodRes || !prodRes.rows || prodRes.rows.length === 0) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Ensure user exists. Many flows use a guest user id (negative) or may not have a users row yet.
        try {
            await pool.query(
                `INSERT INTO users (id, first_name, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
                [uid, uid < 0 ? 'Guest' : 'User']
            )
        } catch (e) {
            // If user creation fails due to other DB constraints, log but continue; the FK will catch it if still invalid
            console.warn('ensure user insert warning', e)
        }

        const query = `
            INSERT INTO cart_items (user_id, product_id, quantity, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, product_id)
            DO UPDATE SET 
                quantity = cart_items.quantity + EXCLUDED.quantity,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `

        const result = await pool.query(query, [uid, pid, qty])
        return NextResponse.json(result.rows[0])
    } catch (error) {
        console.error("Add to cart error:", error)
        return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Use session cookie for authenticated user
        const cookieUser = request.cookies.get('session_user')
        if (!cookieUser || !cookieUser.value) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        const userId = Number(cookieUser.value)

        const { productId, quantity } = await request.json()

        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            const deleteQuery = "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2"
            await pool.query(deleteQuery, [userId, productId])
            return NextResponse.json({ success: true })
        }

        const query = `
            UPDATE cart_items 
            SET quantity = $3, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND product_id = $2
            RETURNING *
        `

        const result = await pool.query(query, [userId, productId, quantity])
        return NextResponse.json(result.rows[0])
    } catch (error) {
        console.error("Update cart error:", error)
        return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get("productId")

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 })
        }

        const cookieUser = request.cookies.get('session_user')
        if (!cookieUser || !cookieUser.value) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        const userId = Number(cookieUser.value)

        const query = "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2"
        await pool.query(query, [userId, productId])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Remove from cart error:", error)
        return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 })
    }
}
