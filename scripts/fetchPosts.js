const { Client } = require('pg');
const axios = require('axios');

// Database connection
const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function main() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Ensure table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY,
                description TEXT,
                photos JSONB,
                videos JSONB
            );
        `);
        console.log('Table "posts" checked/created.');

        // Fetch and insert posts
        for (let id = 743; id <= 900; id++) {
            try {
                const url = `https://emp.alwaysdata.net/api/v2/getpostby_id/Chef_figoz/${id}`;
                const response = await axios.get(url);
                const { description, photos, videos } = response.data;

                // Check if the ID already exists to prevent redundancy
                const checkQuery = `SELECT id FROM posts WHERE id = $1`;
                const existingPost = await client.query(checkQuery, [id]);

                if (existingPost.rows.length > 0) {
                    console.log(`ID ${id} already exists. Skipping insertion.`);
                    continue; // Skip to the next ID
                }

                // Convert arrays to JSON strings for JSONB columns
                const photosJson = JSON.stringify(photos || []); // Ensure it's an empty array if null/undefined
                const videosJson = JSON.stringify(videos || []); // Ensure it's an empty array if null/undefined

                const insertQuery = `
                    INSERT INTO posts(id, description, photos, videos)
                    VALUES($1, $2, $3, $4)
                `;
                await client.query(insertQuery, [id, description, photosJson, videosJson]);
                console.log(`Inserted post ${id}`);
            } catch (err) {
                // Log the specific error for the current ID but continue if it's a non-critical error (e.g., API fetch failure)
                // If you want to stop on *any* error for an ID, uncomment the 'throw err;' below.
                console.error(`Error processing id ${id}:`, err.message);
                // If the error is due to bad data from the API for a specific ID, you might want to log and continue
                // rather than stopping the entire script. However, your original request was "no error tolerated",
                // so I'm re-adding the throw to stop on the first error encountered for an ID.
                throw err;
            }
        }

        console.log('All posts fetched and stored (or skipped if existing).');
    } catch (err) {
        console.error('Script terminated due to a critical error:', err.message);
    } finally {
        // Ensure the client connection is always closed
        if (client) {
            await client.end();
            console.log('Database connection closed');
        }
    }
}

main();
