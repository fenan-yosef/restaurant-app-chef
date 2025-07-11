"use client"

import { useState, useMemo } from "react"
import { useDebounce } from "./useDebounce"
import type { Product } from "@/lib/types"

interface SearchFilters {
    query: string
    category?: string
    design?: string
    flavor?: string
    occasion?: string
    size?: string
    priceRange?: { min: number; max: number }
    sortBy?: "name" | "price" | "created_at"
    sortOrder?: "asc" | "desc"
}

interface UseAdvancedSearchProps {
    products: Product[]
    initialFilters?: Partial<SearchFilters>
}

export function useAdvancedSearch({ products, initialFilters = {} }: UseAdvancedSearchProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        sortBy: "created_at",
        sortOrder: "desc",
        ...initialFilters,
    })

    const debouncedQuery = useDebounce(filters.query, 300)

    const filteredProducts = useMemo(() => {
        let result = [...products]

        // Text search with fuzzy matching
        if (debouncedQuery.trim()) {
            const searchTerms = debouncedQuery.toLowerCase().split(" ").filter(Boolean)

            result = result.filter((product) => {
                const searchableText = [
                    product.name,
                    product.description,
                    product.category,
                    product.design,
                    product.flavor,
                    product.occasion,
                    product.size,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()

                return searchTerms.every(
                    (term) =>
                        searchableText.includes(term) ||
                        // Fuzzy matching - allow 1 character difference for terms > 3 chars
                        (term.length > 3 &&
                            searchableText.split(" ").some((word) => word.length > 3 && levenshteinDistance(word, term) <= 1)),
                )
            })
        }

        // Category filter
        if (filters.category && filters.category !== "all") {
            result = result.filter((product) => product.category?.toLowerCase().includes(filters.category!.toLowerCase()))
        }

        // Design filter
        if (filters.design && filters.design !== "all") {
            result = result.filter((product) => product.design?.toLowerCase().includes(filters.design!.toLowerCase()))
        }

        // Flavor filter
        if (filters.flavor && filters.flavor !== "all") {
            result = result.filter((product) => product.flavor?.toLowerCase().includes(filters.flavor!.toLowerCase()))
        }

        // Occasion filter
        if (filters.occasion && filters.occasion !== "all") {
            result = result.filter((product) => product.occasion?.toLowerCase().includes(filters.occasion!.toLowerCase()))
        }

        // Size filter
        if (filters.size && filters.size !== "all") {
            result = result.filter((product) => product.size?.toLowerCase().includes(filters.size!.toLowerCase()))
        }

        // Price range filter
        if (filters.priceRange) {
            const { min, max } = filters.priceRange
            result = result.filter((product) => {
                const price = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
                return (!min || price >= min) && (!max || price <= max)
            })
        }

        // Sorting
        result.sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (filters.sortBy) {
                case "name":
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case "price":
                    aValue = typeof a.price === "string" ? Number.parseFloat(a.price) : a.price
                    bValue = typeof b.price === "string" ? Number.parseFloat(b.price) : b.price
                    break
                case "created_at":
                default:
                    aValue = new Date(a.created_at).getTime()
                    bValue = new Date(b.created_at).getTime()
                    break
            }

            if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
            return 0
        })

        return result
    }, [products, debouncedQuery, filters])

    const updateFilter = (key: keyof SearchFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            query: "",
            category: undefined, // Explicitly clear category
            design: undefined, // Explicitly clear design
            flavor: undefined, // Explicitly clear flavor
            occasion: undefined, // Explicitly clear occasion
            size: undefined, // Explicitly clear size
            priceRange: undefined, // Explicitly clear price range
            sortBy: "created_at",
            sortOrder: "desc",
        })
    }

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text

        const searchTerms = query.toLowerCase().split(" ").filter(Boolean)
        let highlightedText = text

        searchTerms.forEach((term) => {
            const regex = new RegExp(`(${term})`, "gi")
            highlightedText = highlightedText.replace(regex, "<mark>$1</mark>")
        })

        return highlightedText
    }

    return {
        filters,
        filteredProducts,
        updateFilter,
        clearFilters,
        highlightText,
        isSearching: debouncedQuery !== filters.query,
    }
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
            }
        }
    }

    return matrix[str2.length][str1.length]
}
