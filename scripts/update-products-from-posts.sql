-- Update products table to use real data from posts with better parsing
-- First, let's add new columns for the structured data
ALTER TABLE products ADD COLUMN IF NOT EXISTS design VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS flavor VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS post_id INTEGER;

-- Clear existing sample data
DELETE FROM products WHERE name LIKE '%Artisan%' OR name LIKE '%Chocolate%' OR name LIKE '%Blueberry%';

-- Insert real products from posts data with flexible parsing
INSERT INTO products (name, description, price, category, photos, videos, design, flavor, occasion, size, post_id, is_available, created_at, updated_at)
SELECT 
    COALESCE(
        NULLIF(TRIM(REGEXP_REPLACE(
            SUBSTRING(description FROM '(?i)title:\s*([^\n\r]*?)(?=\s*(?:category|design|flavor|occasion|size|$))'),
            '[^\w\s-]', '', 'g'
        )), ''),
        'Delicious Item'
    ) as name,
    description,
    -- Set random prices between $5-50 for now
    (5 + (RANDOM() * 45))::DECIMAL(10,2) as price,
    COALESCE(
        NULLIF(TRIM(REGEXP_REPLACE(
            SUBSTRING(description FROM '(?i)category:\s*([^\n\r]*?)(?=\s*(?:title|design|flavor|occasion|size|$))'),
            '[^\w\s-]', '', 'g'
        )), ''),
        'General'
    ) as category,
    photos,
    videos,
    NULLIF(TRIM(REGEXP_REPLACE(
        SUBSTRING(description FROM '(?i)design:\s*([^\n\r]*?)(?=\s*(?:title|category|flavor|occasion|size|$))'),
        '[^\w\s-]', '', 'g'
    )), '') as design,
    NULLIF(TRIM(REGEXP_REPLACE(
        SUBSTRING(description FROM '(?i)flavor:\s*([^\n\r]*?)(?=\s*(?:title|category|design|occasion|size|$))'),
        '[^\w\s-]', '', 'g'
    )), '') as flavor,
    NULLIF(TRIM(REGEXP_REPLACE(
        SUBSTRING(description FROM '(?i)occasion:\s*([^\n\r]*?)(?=\s*(?:title|category|design|flavor|size|$))'),
        '[^\w\s-]', '', 'g'
    )), '') as occasion,
    NULLIF(TRIM(REGEXP_REPLACE(
        SUBSTRING(description FROM '(?i)size:\s*([^\n\r]*?)(?=\s*(?:title|category|design|flavor|occasion|$))'),
        '[^\w\s-]', '', 'g'
    )), '') as size,
    id as post_id,
    true as is_available,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM posts 
WHERE description IS NOT NULL 
AND description != ''
AND photos IS NOT NULL 
AND JSON_ARRAY_LENGTH(photos) > 0;
