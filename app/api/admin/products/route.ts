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
    const adminUserId = Number(searchParams.get("adminUserId"))

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
           design, flavor, occasion, size, post_id, is_available,
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
    } = await request.json()

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
    INSERT INTO products (name, description, price, category, photos, videos, design, flavor, occasion, size, is_available)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `
    try {
        const result = await pool.query(query, [
            name,
            description || null,
            price,
            category || null,
            JSON.stringify(photos || []),
            JSON.stringify(videos || []),
            design || null,
            flavor || null,
            occasion || null,
            size || null,
            is_available !== undefined ? is_available : true,
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
    } = await request.json()

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

    if (!id || !name || !price) {
        return NextResponse.json({ error: "Product ID, name, and price are required for update" }, { status: 400 })
    }

    const query = `
    UPDATE products
    SET name = $1, description = $2, price = $3, category = $4, photos = $5, videos = $6,
        design = $7, flavor = $8, occasion = $9, size = $10, is_available = $11, updated_at = CURRENT_TIMESTAMP
    WHERE id = $12
    RETURNING *
  `
    try {
        const result = await pool.query(query, [
            name,
            description || null,
            price,
            category || null,
            JSON.stringify(photos || []),
            JSON.stringify(videos || []),
            design || null,
            flavor || null,
            occasion || null,
            size || null,
            is_available,
            id,
        ])
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
