import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId")

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const ordersQuery = `
      SELECT o.*, 
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
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `

        const result = await pool.query(ordersQuery, [userId])
        return NextResponse.json(result.rows)
    } catch (error) {
        console.error("Orders fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const { userId, deliveryAddress, phoneNumber, notes } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        // Get cart items
        const cartQuery = `
      SELECT ci.*, p.price, p.name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `
        const cartResult = await client.query(cartQuery, [userId])

        if (cartResult.rows.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
        }

        // Calculate total
        const totalAmount = cartResult.rows.reduce((sum, item) => {
            return sum + item.price * item.quantity
        }, 0)

        // Create order
        const orderQuery = `
      INSERT INTO orders (user_id, total_amount, delivery_address, phone_number, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
        const orderResult = await client.query(orderQuery, [userId, totalAmount, deliveryAddress, phoneNumber, notes])
        const order = orderResult.rows[0]

        // Create order items
        for (const item of cartResult.rows) {
            const orderItemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `
            await client.query(orderItemQuery, [order.id, item.product_id, item.quantity, item.price])
        }

        // Clear cart
        await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId])

        await client.query("COMMIT")
        return NextResponse.json(order)
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Order creation error:", error)
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    } finally {
        client.release()
    }
}
