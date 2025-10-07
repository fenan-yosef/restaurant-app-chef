import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { telegramLogger } from "@/lib/telegram-logger"
import { config } from "@/lib/config"

// Helper to check if a user is an admin
function isAdmin(userId: number | undefined): boolean {
    // Allow access in development for easier local testing
    if (config.app.isDevelopment) {
        telegramLogger.debug(`Development mode detected - bypassing admin ID check.`, "admin/products/isAdmin")
        return true
    }

    const result = userId !== undefined && config.app.adminChatIds.includes(userId)
    telegramLogger.debug(
        `isAdmin check: User ID ${userId}, Admin IDs: ${JSON.stringify(config.app.adminChatIds)}, Result: ${result}`,
        "admin/products/isAdmin",
    )
    return result
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const adminUserId = Number(searchParams.get("adminUserId"))

    // Server-side logging for debugging
    telegramLogger.debug(`Admin products GET: Received adminUserId: ${adminUserId}`, "admin/products/GET")

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(
            `Unauthorized access attempt to admin products GET by user ID: ${adminUserId}`,
            "admin/products/GET",
        )
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(`Admin products GET request by user ID: ${adminUserId}`, "admin/products/GET")

    const query = `
    SELECT id, name, description, price, category, photos, videos,
           design, flavor, occasion, size, post_id, is_available, stock,
           created_at, updated_at
    FROM products
    ORDER BY created_at DESC
  `
    try {
        const result = await pool.query(query)
        return NextResponse.json(result.rows)
    } catch (error: any) {
        telegramLogger.error(`Failed to fetch admin products: ${error.message}`, "admin/products/GET")
        return NextResponse.json({ error: "Failed to fetch products", details: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const {
        adminUserId,
        name,
        description,
        price,
        category,
        photos,
        videos,
        design,
        flavor,
        occasion,
        size,
        is_available,
        stock,
    } = await request.json()

    // Server-side logging for debugging
    telegramLogger.debug(
        `Admin products POST: Received adminUserId: ${adminUserId}, name: ${name}, price: ${price}`,
        "admin/products/POST",
    )

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(
            `Unauthorized access attempt to admin products POST by user ID: ${adminUserId}`,
            "admin/products/POST",
        )
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(`Admin products POST request by user ID: ${adminUserId}`, "admin/products/POST")

    if (!name || !price) {
        return NextResponse.json({ error: "Product name and price are required" }, { status: 400 })
    }

    const query = `
    INSERT INTO products (name, description, price, category, photos, videos, design, flavor, occasion, size, post_id, is_available, stock)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `
    try {
        const result = await pool.query(query, [
            name,
            description || null,
            price,
            category || null,
            photos || [],
            videos || [],
            design || null,
            flavor || null,
            occasion || null,
            size || null,
            null, // post_id (optional)
            is_available !== undefined ? is_available : true,
            stock !== undefined ? stock : 0,
        ])
        telegramLogger.info(`Product created: ${result.rows[0].name} (ID: ${result.rows[0].id})`, "admin/products/POST")
        return NextResponse.json(result.rows[0])
    } catch (error: any) {
        telegramLogger.error(`Failed to add product: ${error.message}`, "admin/products/POST")
        return NextResponse.json({ error: "Failed to add product", details: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const {
        adminUserId,
        id,
        name,
        description,
        price,
        category,
        photos,
        videos,
        design,
        flavor,
        occasion,
        size,
        is_available,
        stock,
    } = await request.json()

    // Server-side logging for debugging
    telegramLogger.debug(
        `Admin products PUT: Received adminUserId: ${adminUserId}, productId: ${id}, price: ${price}`,
        "admin/products/PUT",
    )

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(
            `Unauthorized access attempt to admin products PUT by user ID: ${adminUserId}`,
            "admin/products/PUT",
        )
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(
        `Admin products PUT request for product ID: ${id} by user ID: ${adminUserId}`,
        "admin/products/PUT",
    )

    if (!id) {
        return NextResponse.json({ error: "Product ID is required for update" }, { status: 400 })
    }

    // Dynamically build the SET clause for partial updates
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (name !== undefined) {
        updates.push(`name = $${paramCount++}`)
        values.push(name)
    }
    if (description !== undefined) {
        updates.push(`description = $${paramCount++}`)
        values.push(description)
    }
    if (price !== undefined) {
        updates.push(`price = $${paramCount++}`)
        values.push(price)
    }
    if (category !== undefined) {
        updates.push(`category = $${paramCount++}`)
        values.push(category)
    }
    if (photos !== undefined) {
        updates.push(`photos = $${paramCount++}`)
        values.push(photos)
    }
    if (videos !== undefined) {
        updates.push(`videos = $${paramCount++}`)
        values.push(videos)
    }
    if (design !== undefined) {
        updates.push(`design = $${paramCount++}`)
        values.push(design)
    }
    if (flavor !== undefined) {
        updates.push(`flavor = $${paramCount++}`)
        values.push(flavor)
    }
    if (occasion !== undefined) {
        updates.push(`occasion = $${paramCount++}`)
        values.push(occasion)
    }
    if (size !== undefined) {
        updates.push(`size = $${paramCount++}`)
        values.push(size)
    }
    if (is_available !== undefined) {
        updates.push(`is_available = $${paramCount++}`)
        values.push(is_available)
    }
    if (stock !== undefined) {
        updates.push(`stock = $${paramCount++}`)
        values.push(stock)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updates.length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const query = `
    UPDATE products
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *
  `
    values.push(id) // Add product ID as the last value

    try {
        const result = await pool.query(query, values)
        if (result.rows.length === 0) {
            telegramLogger.warn(`Product ${id} not found for update by user ID: ${adminUserId}`, "admin/products/PUT")
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }
        telegramLogger.info(`Product updated: ${result.rows[0].name} (ID: ${result.rows[0].id})`, "admin/products/PUT")
        return NextResponse.json(result.rows[0])
    } catch (error: any) {
        telegramLogger.error(`Failed to update product ${id}: ${error.message}`, "admin/products/PUT")
        return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const { adminUserId, productId } = await request.json()

    // Server-side logging for debugging
    telegramLogger.debug(
        `Admin products DELETE: Received adminUserId: ${adminUserId}, productId: ${productId}`,
        "admin/products/DELETE",
    )

    if (!isAdmin(adminUserId)) {
        telegramLogger.warn(
            `Unauthorized access attempt to admin products DELETE by user ID: ${adminUserId}`,
            "admin/products/DELETE",
        )
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    telegramLogger.info(
        `Admin products DELETE request for product ID: ${productId} by user ID: ${adminUserId}`,
        "admin/products/DELETE",
    )

    if (!productId) {
        return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const query = `
    DELETE FROM products
    WHERE id = $1
    RETURNING id
  `
    try {
        const result = await pool.query(query, [productId])
        if (result.rows.length === 0) {
            telegramLogger.warn(
                `Product ${productId} not found for deletion by user ID: ${adminUserId}`,
                "admin/products/DELETE",
            )
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }
        telegramLogger.info(`Product deleted: ID ${result.rows[0].id}`, "admin/products/DELETE")
        return NextResponse.json({ success: true, id: result.rows[0].id })
    } catch (error: any) {
        telegramLogger.error(`Failed to delete product ${productId}: ${error.message}`, "admin/products/DELETE")
        return NextResponse.json({ error: "Failed to delete product", details: error.message }, { status: 500 })
    }
}
