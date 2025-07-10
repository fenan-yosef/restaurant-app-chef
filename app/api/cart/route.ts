import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId")

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
        const { userId, productId, quantity } = await request.json()

        if (!userId || !productId || !quantity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

        const result = await pool.query(query, [userId, productId, quantity])
        return NextResponse.json(result.rows[0])
    } catch (error) {
        console.error("Add to cart error:", error)
        return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId, productId, quantity } = await request.json()

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
        const userId = searchParams.get("userId")
        const productId = searchParams.get("productId")

        if (!userId || !productId) {
            return NextResponse.json({ error: "User ID and Product ID required" }, { status: 400 })
        }

        const query = "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2"
        await pool.query(query, [userId, productId])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Remove from cart error:", error)
        return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 })
    }
}
