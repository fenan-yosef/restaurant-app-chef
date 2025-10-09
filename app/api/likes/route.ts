import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        console.log('[Likes API] GET', request.url)
        const { searchParams } = new URL(request.url)
        const productIdParam = searchParams.get("productId")
        const idsParam = searchParams.get("ids")

        // If 'ids' param provided, return counts for all ids (batch)
        if (idsParam) {
            console.log('[Likes API] batch counts for ids=', idsParam)
            const ids = idsParam.split(",").map((s) => Number(s)).filter((n) => !Number.isNaN(n))
            if (ids.length === 0) return NextResponse.json({ counts: {} })
            const res = await pool.query(`SELECT product_id, COUNT(*)::int as count FROM likes WHERE product_id = ANY($1::int[]) GROUP BY product_id`, [ids])
            const counts: Record<number, number> = {}
            res.rows.forEach((row: any) => { counts[row.product_id] = Number(row.count) })
            console.log('[Likes API] batch counts result:', counts)
            return NextResponse.json({ counts })
        }

        // If productId provided, return count and whether current user liked it
        if (productIdParam) {
            console.log('[Likes API] single product query productId=', productIdParam)
            const pid = Number(productIdParam)
            if (Number.isNaN(pid)) return NextResponse.json({ error: "Invalid productId" }, { status: 400 })

            const countRes = await pool.query("SELECT COUNT(*) as count FROM likes WHERE product_id = $1", [pid])
            const count = Number(countRes.rows[0].count || 0)

            // Determine if current user liked it via session cookie
            const cookieUser = request.cookies.get('session_user')
            console.log('[Likes API] session_user cookie:', cookieUser?.value)
            let is_liked = false
            if (cookieUser && cookieUser.value) {
                const uid = Number(cookieUser.value)
                if (!Number.isNaN(uid)) {
                    const ures = await pool.query("SELECT 1 FROM likes WHERE product_id = $1 AND user_id = $2 LIMIT 1", [pid, uid])
                    is_liked = ures.rows.length > 0
                }
            }

            return NextResponse.json({ productId: pid, count, is_liked })
        }

        // If no productId, return liked products for the current user (requires session)
        const cookieUser = request.cookies.get('session_user')
        console.log('[Likes API] GET liked products for user, session_user:', cookieUser?.value)
        if (!cookieUser || !cookieUser.value) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        const uid = Number(cookieUser.value)
        if (Number.isNaN(uid)) return NextResponse.json({ error: "Invalid user" }, { status: 400 })

        const query = `
            SELECT p.* FROM likes l
            JOIN products p ON p.id = l.product_id
            WHERE l.user_id = $1
            ORDER BY l.created_at DESC
        `
        const result = await pool.query(query, [uid])
        return NextResponse.json(result.rows)
    } catch (error) {
        console.error("Likes GET error:", error)
        return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('[Likes API] POST', request.url)
        const body = await request.json()
        const productId = Number(body?.productId ?? body?.product_id)
        console.log('[Likes API] POST body productId=', productId)
        if (Number.isNaN(productId)) return NextResponse.json({ error: "productId required" }, { status: 400 })

        const cookieUser = request.cookies.get('session_user')
        console.log('[Likes API] session_user cookie (POST):', cookieUser?.value)
        if (!cookieUser || !cookieUser.value) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        const uid = Number(cookieUser.value)
        if (Number.isNaN(uid)) return NextResponse.json({ error: "Invalid user" }, { status: 400 })

        // Ensure product exists
        const prod = await pool.query("SELECT id FROM products WHERE id = $1", [productId])
        if (!prod || prod.rows.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 })

        // Insert like (idempotent)
        const insertQ = `
            INSERT INTO likes (user_id, product_id, created_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, product_id) DO NOTHING
            RETURNING *
        `
        const res = await pool.query(insertQ, [uid, productId])
        console.log('[Likes API] inserted like, result rows:', res.rowCount)

        // Return updated count and is_liked true
        const countRes = await pool.query("SELECT COUNT(*) as count FROM likes WHERE product_id = $1", [productId])
        const count = Number(countRes.rows[0].count || 0)
        console.log('[Likes API] POST updated count for product', productId, '=>', count)

        return NextResponse.json({ success: true, is_liked: true, count, inserted: res.rows[0] || null })
    } catch (error) {
        console.error("Likes POST error:", error)
        return NextResponse.json({ error: "Failed to like product" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        console.log('[Likes API] DELETE', request.url)
        const { searchParams } = new URL(request.url)
        const productIdParam = searchParams.get("productId")
        if (!productIdParam) return NextResponse.json({ error: "productId required" }, { status: 400 })
        const pid = Number(productIdParam)
        console.log('[Likes API] DELETE productId=', pid)
        if (Number.isNaN(pid)) return NextResponse.json({ error: "Invalid productId" }, { status: 400 })

        const cookieUser = request.cookies.get('session_user')
        console.log('[Likes API] session_user cookie (DELETE):', cookieUser?.value)
        if (!cookieUser || !cookieUser.value) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        const uid = Number(cookieUser.value)
        if (Number.isNaN(uid)) return NextResponse.json({ error: "Invalid user" }, { status: 400 })

        await pool.query("DELETE FROM likes WHERE user_id = $1 AND product_id = $2", [uid, pid])
        const countRes = await pool.query("SELECT COUNT(*) as count FROM likes WHERE product_id = $1", [pid])
        const count = Number(countRes.rows[0].count || 0)
        console.log('[Likes API] DELETE updated count for product', pid, '=>', count)
        return NextResponse.json({ success: true, is_liked: false, count })
    } catch (error) {
        console.error("Likes DELETE error:", error)
        return NextResponse.json({ error: "Failed to remove like" }, { status: 500 })
    }
}
