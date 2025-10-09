import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const design = searchParams.get("design")
        const flavor = searchParams.get("flavor")
        const occasion = searchParams.get("occasion")
        const size = searchParams.get("size")
        const search = searchParams.get("search")
        const page = Number.parseInt(searchParams.get("page") || "1")
        const limit = Number.parseInt(searchParams.get("limit") || "20")
        const offset = (page - 1) * limit

        let query = `
      SELECT id, name, description, price, category, photos, videos, 
             design, flavor, occasion, size, post_id, is_available, 
             created_at, updated_at
      FROM products 
      WHERE is_available = true
    `
        const values: any[] = []
        let paramCount = 0

        // Add filters only if they exist and are not "all"
        if (category && category !== "all" && category.trim() !== "") {
            paramCount++
            query += ` AND category ILIKE $${paramCount}`
            values.push(`%${category}%`)
        }

        if (design && design !== "all" && design.trim() !== "") {
            paramCount++
            query += ` AND design ILIKE $${paramCount}`
            values.push(`%${design}%`)
        }

        if (flavor && flavor !== "all" && flavor.trim() !== "") {
            paramCount++
            query += ` AND flavor ILIKE $${paramCount}`
            values.push(`%${flavor}%`)
        }

        if (occasion && occasion !== "all" && occasion.trim() !== "") {
            paramCount++
            query += ` AND occasion ILIKE $${paramCount}`
            values.push(`%${occasion}%`)
        }

        if (size && size !== "all" && size.trim() !== "") {
            paramCount++
            query += ` AND size ILIKE $${paramCount}`
            values.push(`%${size}%`)
        }

        if (search && search.trim() !== "") {
            paramCount++
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR category ILIKE $${paramCount})`
            values.push(`%${search}%`)
        }

        // Sorting: allow sortBy and sortOrder as query params (whitelist)
        const sortBy = searchParams.get("sortBy") || "created_at"
        const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC"
        const allowedSortColumns: Record<string, string> = {
            id: "id",
            name: "LOWER(name)",
            price: "price",
            category: "LOWER(category)",
            created_at: "created_at",
            updated_at: "updated_at",
        }
        const sortColumn = allowedSortColumns[sortBy] || allowedSortColumns["created_at"]

        // Add ordering and pagination
        query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
        values.push(limit, offset)

        console.log("Executing query:", query)
        console.log("With values:", values)

    const result = await pool.query(query, values)

        // Get total count for pagination
        let countQuery = `
      SELECT COUNT(*) as total
      FROM products 
      WHERE is_available = true
    `
        const countValues: any[] = []
        let countParamCount = 0

        // Apply same filters to count query
        if (category && category !== "all" && category.trim() !== "") {
            countParamCount++
            countQuery += ` AND category ILIKE $${countParamCount}`
            countValues.push(`%${category}%`)
        }

        if (design && design !== "all" && design.trim() !== "") {
            countParamCount++
            countQuery += ` AND design ILIKE $${countParamCount}`
            countValues.push(`%${design}%`)
        }

        if (flavor && flavor !== "all" && flavor.trim() !== "") {
            countParamCount++
            countQuery += ` AND flavor ILIKE $${countParamCount}`
            countValues.push(`%${flavor}%`)
        }

        if (occasion && occasion !== "all" && occasion.trim() !== "") {
            countParamCount++
            countQuery += ` AND occasion ILIKE $${countParamCount}`
            countValues.push(`%${occasion}%`)
        }

        if (size && size !== "all" && size.trim() !== "") {
            countParamCount++
            countQuery += ` AND size ILIKE $${countParamCount}`
            countValues.push(`%${size}%`)
        }

        if (search && search.trim() !== "") {
            countParamCount++
            countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount} OR category ILIKE $${countParamCount})`
            countValues.push(`%${search}%`)
        }

        const countResult = await pool.query(countQuery, countValues)
        const total = Number.parseInt(countResult.rows[0].total)

        // Enrich products with is_liked when possible
        const products = result.rows

        try {
            const cookieUser = request.cookies.get('session_user')
            if (cookieUser && cookieUser.value && products.length > 0) {
                const uid = Number(cookieUser.value)
                if (!Number.isNaN(uid)) {
                    const ids = products.map((p: any) => p.id)
                    const likesRes = await pool.query(
                        `SELECT product_id FROM likes WHERE product_id = ANY($1::int[]) AND user_id = $2`,
                        [ids, uid]
                    )
                    const likedSet = new Set(likesRes.rows.map((r: any) => Number(r.product_id)))
                    const enriched = products.map((p: any) => ({ ...p, is_liked: likedSet.has(Number(p.id)) }))
                    return NextResponse.json({
                        products: enriched,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages: Math.ceil(total / limit),
                            hasMore: page * limit < total,
                        },
                    })
                }
            }
        } catch (err) {
            console.warn('Failed to enrich products with is_liked', err)
        }

        return NextResponse.json({
            products: products.map((p: any) => ({ ...p, is_liked: false })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        })
    } catch (error) {
        console.error("Products fetch error:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({ error: "Failed to fetch products", details: errorMessage }, { status: 500 })
    }
}
