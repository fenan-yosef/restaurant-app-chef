import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const search = searchParams.get("search")

        let query = "SELECT * FROM products WHERE is_available = true"
        const values: any[] = []

        if (category) {
            query += " AND category = $" + (values.length + 1)
            values.push(category)
        }

        if (search) {
            query += " AND (name ILIKE $" + (values.length + 1) + " OR description ILIKE $" + (values.length + 1) + ")"
            values.push(`%${search}%`)
        }

        query += " ORDER BY created_at DESC"

        const result = await pool.query(query, values)
        return NextResponse.json(result.rows)
    } catch (error) {
        console.error("Products fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }
}
