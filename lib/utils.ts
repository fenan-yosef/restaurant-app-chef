import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Safely converts a value to a number, handling PostgreSQL numeric strings
 * @param value - The value to convert (string, number, or null/undefined)
 * @param defaultValue - Default value if conversion fails
 * @returns A valid number
 */
export function toNumber(value: string | number | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === "number") return isNaN(value) ? defaultValue : value
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value)
        return isNaN(parsed) ? defaultValue : parsed
    }
    return defaultValue
}

/**
 * Formats a price value safely, handling PostgreSQL numeric strings
 * @param price - The price value (string or number)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export function formatPrice(price: string | number | null | undefined, decimals = 2): string {
    return toNumber(price).toFixed(decimals)
}

/**
 * Formats currency with symbol
 * @param price - The price value
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted currency string
 */
export function formatCurrency(price: string | number | null | undefined, currency = "$"): string {
    return `${currency}${formatPrice(price)}`
}
