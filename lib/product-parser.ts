/**
 * Product Description Parser
 * Parses structured product descriptions focusing on text patterns rather than emojis
 */

import type { ParsedProductInfo } from "./types"

export function parseProductDescription(description: string): ParsedProductInfo {
    const defaultInfo: ParsedProductInfo = {
        title: "Delicious Item",
        category: "General",
        design: "Classic",
        flavor: "Sweet",
        occasion: "Any",
        size: "Standard",
    }

    if (!description) return defaultInfo

    try {
        // Extract information using flexible regex patterns that focus on text, not emojis
        const patterns = {
            title:
                /(?:title|Title):\s*([^\n\r]*?)(?=\s*(?:category|Category|design|Design|flavor|Flavor|occasion|Occasion|size|Size|$))/i,
            category:
                /(?:category|Category):\s*([^\n\r]*?)(?=\s*(?:title|Title|design|Design|flavor|Flavor|occasion|Occasion|size|Size|$))/i,
            design:
                /(?:design|Design):\s*([^\n\r]*?)(?=\s*(?:title|Title|category|Category|flavor|Flavor|occasion|Occasion|size|Size|$))/i,
            flavor:
                /(?:flavor|Flavor):\s*([^\n\r]*?)(?=\s*(?:title|Title|category|Category|design|Design|occasion|Occasion|size|Size|$))/i,
            occasion:
                /(?:occasion|Occasion):\s*([^\n\r]*?)(?=\s*(?:title|Title|category|Category|design|Design|flavor|Flavor|size|Size|$))/i,
            size: /(?:size|Size):\s*([^\n\r]*?)(?=\s*(?:title|Title|category|Category|design|Design|flavor|Flavor|occasion|Occasion|$))/i,
        }

        const parsed: ParsedProductInfo = { ...defaultInfo }

        for (const [key, pattern] of Object.entries(patterns)) {
            const match = description.match(pattern)
            if (match && match[1]) {
                // Clean up the extracted text
                let cleanText = match[1].trim()
                // Remove any trailing emojis or special characters
                cleanText = cleanText.replace(/[^\w\s-]/g, "").trim()
                if (cleanText) {
                    parsed[key as keyof ParsedProductInfo] = cleanText
                }
            }
        }

        return parsed
    } catch (error) {
        console.error("Error parsing product description:", error)
        return defaultInfo
    }
}

export function extractCategories(products: any[]): string[] {
    const categories = new Set<string>()

    products.forEach((product) => {
        if (product.category) {
            categories.add(product.category.trim())
        }
    })

    return Array.from(categories).sort()
}

export function extractDesigns(products: any[]): string[] {
    const designs = new Set<string>()

    products.forEach((product) => {
        if (product.design) {
            designs.add(product.design.trim())
        }
    })

    return Array.from(designs).sort()
}

export function extractFlavors(products: any[]): string[] {
    const flavors = new Set<string>()

    products.forEach((product) => {
        if (product.flavor) {
            flavors.add(product.flavor.trim())
        }
    })

    return Array.from(flavors).sort()
}

export function extractOccasions(products: any[]): string[] {
    const occasions = new Set<string>()

    products.forEach((product) => {
        if (product.occasion) {
            occasions.add(product.occasion.trim())
        }
    })

    return Array.from(occasions).sort()
}

export function extractSizes(products: any[]): string[] {
    const sizes = new Set<string>()

    products.forEach((product) => {
        if (product.size) {
            sizes.add(product.size.trim())
        }
    })

    return Array.from(sizes).sort()
}

export function getImageUrl(photos: string[] | string): string {
    try {
        let photoArray: string[] = []

        if (typeof photos === "string") {
            photoArray = JSON.parse(photos)
        } else if (Array.isArray(photos)) {
            photoArray = photos
        }

        if (photoArray.length > 0 && photoArray[0]) {
            return photoArray[0]
        }
    } catch (error) {
        console.error("Error parsing photos:", error)
    }

    return `/placeholder.svg?height=300&width=300`
}
