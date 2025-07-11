import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

const columns = [
    { name: "design", type: "VARCHAR(255)" },
    { name: "flavor", type: "VARCHAR(255)" },
    { name: "occasion", type: "VARCHAR(255)" },
    { name: "size", type: "VARCHAR(255)" },
]

/**
 * Ensure that the extra product-attribute columns exist.
 * This lets the API self-heal in development / first deploys.
 */
async function ensureColumns() {
    const alterParts = columns.map((c) => `ADD COLUMN IF NOT EXISTS ${c.name} ${c.type}`)
    const alterSQL = `ALTER TABLE products ${alterParts.join(", ")};`
    await pool.query(alterSQL)
}

export async function GET(_req: NextRequest) {
    const filtersSQL = `
    SELECT 
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT category), NULL)                         AS categories,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT design),    NULL)                         AS designs,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT flavor),    NULL)                         AS flavors,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT occasion),  NULL)                         AS occasions,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT size),      NULL)                         AS sizes
    FROM products
    WHERE is_available = TRUE;
  `

    try {
        // 1️⃣ First attempt
        const { rows } = await pool.query(filtersSQL)
        const f = rows[0]

        return NextResponse.json({
            categories: f.categories ?? [],
            designs: f.designs ?? [],
            flavors: f.flavors ?? [],
            occasions: f.occasions ?? [],
            sizes: f.sizes ?? [],
        })
    } catch (err: any) {
        // Missing column?  -> auto-migrate then retry once
        if (err.code === "42703") {
            console.warn("[filters API] Column missing. Running automatic migration once …")
            await ensureColumns()
            // 🔁 try again
            const { rows } = await pool.query(filtersSQL)
            const f = rows[0]

            return NextResponse.json({
                categories: f.categories ?? [],
                designs: f.designs ?? [],
                flavors: f.flavors ?? [],
                occasions: f.occasions ?? [],
                sizes: f.sizes ?? [],
            })
        }

        // Anything else → send the real SQL error to the client for easier debugging
        console.error("[filters API] error:", err)
        return NextResponse.json({ error: "Failed to fetch filters", details: err.message }, { status: 500 })
    }
}
