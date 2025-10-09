const axios = require('axios');
const { Client } = require('pg');

// Database connection (we will write into products table)
// Prefer environment variable, fall back to the explicit URL you provided.
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_VobpJh4q6Pkn@ep-tight-rain-a1w95dng-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString });
const dryRun = process.argv.includes("--dry-run")

if (dryRun) {
    console.log("Running in DRY RUN mode: no DB writes will be performed.")
}

function parseDescription(desc) {
    const lines = (desc || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    let name = ""
    let category = null
    let design = null
    let flavor = null
    let occasion = null
    let size = null
    let price = 0

    const remainingLines = []

    for (const line of lines) {
        // Match labels by their constant words only (ignore any leading emojis or decorations)
        const mTitle = line.match(/\bTitle\b[:\-]?\s*(.+)/i)
        const mCategory = line.match(/\bCategory\b[:\-]?\s*(.+)/i)
        const mDesign = line.match(/\bDesign\b[:\-]?\s*(.+)/i)
        const mFlavor = line.match(/\bFlavor\b[:\-]?\s*(.+)/i)
        const mOccasion = line.match(/\bOccasion\b[:\-]?\s*(.+)/i)
        const mSize = line.match(/\bSize\b[:\-]?\s*(.+)/i)
        const mPrice = line.match(/\bPrice\b[:\-]?\s*\$?([0-9]+(?:[.,][0-9]{1,2})?)/i)

        if (mTitle && !name) {
            name = mTitle[1].trim()
            continue
        }
        if (mCategory && !category) {
            category = mCategory[1].trim()
            continue
        }
        if (mDesign && !design) {
            design = mDesign[1].trim()
            continue
        }
        if (mFlavor && !flavor) {
            flavor = mFlavor[1].trim()
            continue
        }
        if (mOccasion && !occasion) {
            occasion = mOccasion[1].trim()
            continue
        }
        if (mSize && !size) {
            size = mSize[1].trim()
            continue
        }
        if (mPrice && !price) {
            price = parseFloat(mPrice[1].replace(/,/g, '.')) || 0
            continue
        }

        remainingLines.push(line)
    }

    // Fallback name: first non-empty remaining line or first line of desc
    if (!name) {
        name = remainingLines[0] || lines[0] || "Untitled Product"
    }

    return {
        name,
        category,
        design,
        flavor,
        occasion,
        size,
        price: Number.isFinite(price) ? Number(price.toFixed(2)) : 0,
        description: (desc || "").trim(),
    }
}

async function main() {
    let dbConnected = false;
    try {
        if (!dryRun) {
            if (!connectionString) {
                console.error('DATABASE_URL is not set. Set process.env.DATABASE_URL or run with --dry-run to avoid DB writes.');
                return;
            }
            try {
                await client.connect();
                dbConnected = true;
                console.log('Connected to database');
            } catch (connErr) {
                console.error('Failed to connect to database:', connErr.message || connErr);
                console.error('Check DATABASE_URL, network connectivity, and DNS. Example: postgres://user:pass@localhost:5432/dbname');
                return;
            }

            // Ensure products table exists with the expected columns (minimal safe schema)
            await client.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    price NUMERIC(10,2) NOT NULL DEFAULT 0,
                    category VARCHAR(100),
                    photos JSONB DEFAULT '[]'::jsonb,
                    videos JSONB DEFAULT '[]'::jsonb,
                    is_available BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    design VARCHAR(255),
                    flavor VARCHAR(255),
                    occasion VARCHAR(255),
                    size VARCHAR(255),
                    post_id INTEGER,
                    stock INTEGER DEFAULT 0
                );
            `);
            console.log('Ensured products table exists.');
        } else {
            console.log('DRY RUN: skipping DB connect and schema changes.')
        }
        // Note: DB logic is intentionally commented out while developing in-browser.
        // await client.connect();
        // console.log('Connected to database');

        // // Ensure table exists
        // await client.query(`
        //     CREATE TABLE IF NOT EXISTS posts (
        //         id INTEGER PRIMARY KEY,
        //         description TEXT,
        //         photos JSONB,
        //         videos JSONB
        //     );
        // `);
        // console.log('Table "posts" checked/created.');

        // Fetch posts starting from 901 until the API signals no more posts
        let id = 901;
        while (true) {
            try {
                const url = `https://emp.alwaysdata.net/api/v2/getpostby_id/Chef_figoz/${id}`;
                const response = await axios.get(url);

                // Some endpoints return a 200 with an error payload; check for that
                if (response && response.data && response.data.error) {
                    console.log(`Stopped: API returned error for id ${id}:`, response.data);
                    break;
                }

                const { description, photos, videos } = response.data;
                console.log(`Fetched post ${id}:`);
                console.log(JSON.stringify({ description, photos, videos }, null, 2));

                // Parse description into product fields
                const parsed = parseDescription(description);

                // Prepare media JSON: in dry-run we report presence, in real run we store arrays
                const photosJson = dryRun ? null : JSON.stringify(photos || [])
                const videosJson = dryRun ? null : JSON.stringify(videos || [])
                const values = [
                    parsed.name,
                    parsed.description,
                    parsed.price,
                    parsed.category,
                    photosJson,
                    videosJson,
                    true,
                    parsed.design,
                    parsed.flavor,
                    parsed.occasion,
                    parsed.size,
                    id,
                    0,
                ];

                if (dryRun) {
                    console.log(`DRY RUN - would insert product from post ${id} with parsed fields:`)
                    console.log(JSON.stringify({ parsed, photos_present: (photos || []).length, videos_present: (videos || []).length }, null, 2))
                } else {
                    // Check if a product with this post_id already exists
                    const checkRes = await client.query('SELECT id FROM products WHERE post_id = $1', [id]);
                    if (checkRes.rows.length > 0) {
                        console.log(`Skipping id ${id}: product already exists with post_id ${id}`);
                        id++;
                        continue;
                    }

                    // Prepare insert into products table
                    const insertQuery = `
                        INSERT INTO products (name, description, price, category, photos, videos, is_available, design, flavor, occasion, size, post_id, stock)
                        VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)
                        RETURNING id
                    `;

                    try {
                        const res = await client.query(insertQuery, values);
                        console.log(`Inserted product id=${res.rows[0].id} from post ${id}`);
                    } catch (dbErr) {
                        console.error(`DB insert failed for post ${id}:`, dbErr.message || dbErr);
                    }
                }

                id++;
            } catch (err) {
                // If server returns 404 HTTP status
                if (err.response && err.response.status === 404) {
                    console.log(`Stopped: got 404 for id ${id}`);
                } else if (err.response && err.response.data) {
                    // Server returned a JSON body with an error (non-200), print and stop
                    console.log(`Stopped: server responded with error for id ${id}:`, err.response.data);
                } else {
                    console.error(`Stopped: error for id ${id}:`, err.message || err);
                }
                break;
            }
        }

        console.log('All posts fetched and stored (or skipped if existing).');
    } catch (err) {
        console.error('Script terminated due to a critical error:', err.message);
    } finally {
        // Ensure the client connection is only closed if we actually connected
        if (!dryRun && dbConnected) {
            try {
                await client.end();
                console.log('Database connection closed');
            } catch (e) {
                console.warn('Error closing DB client:', e.message || e)
            }
        }
    }
}

main();
