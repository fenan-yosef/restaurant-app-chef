/**
 * API Client with Environment-Aware Configuration
 *
 * This module provides a centralized API client that automatically
 * switches between mock data (development) and real API calls (production).
 */

import { config } from "./config"
import { mockProducts, mockCartItems, mockOrders, mockUser } from "./mock-data"
import { mockLikes } from "./mock-data"
import type { Product, CartItem, Order, TelegramUser } from "./types"

class ApiClient {
    private baseUrl: string
    private timeout: number

    // Helper to decide whether to use mock mode at runtime. Allows forcing real API via URL param or env var.
    private useMock(): boolean {
        if (!config.telegram.mockMode) return false
        try {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search)
                if (params.get('realapi') === '1') {
                    console.debug('[apiClient] realapi override in URL, using real API')
                    return false
                }
                // If a session_user cookie exists we should prefer the real API so likes persist
                const cookieMatch = document.cookie.match(/session_user=([^;\s]+)/)
                if (cookieMatch && Number(cookieMatch[1]) > 0) {
                    console.debug('[apiClient] session_user cookie detected, using real API')
                    return false
                }
            }
        } catch (e) {
            // ignore
        }
        if (process.env.NEXT_PUBLIC_FORCE_REAL_API === '1') {
            console.debug('[apiClient] NEXT_PUBLIC_FORCE_REAL_API set, using real API')
            return false
        }
        return true
    }

    constructor() {
        this.baseUrl = config.api.baseUrl
        this.timeout = config.api.timeout
    }

    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        try {
            if (typeof window !== 'undefined') console.debug('[apiClient] fetch', url, options)
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            return response
        } catch (error) {
            clearTimeout(timeoutId)
            throw error
        }
    }

    // Products API
    async getProducts(category?: string, search?: string): Promise<Product[]> {
        if (config.telegram.mockMode) {
            let products = mockProducts

            if (category) {
                products = products.filter((p) => p.category === category)
            }

            if (search) {
                products = products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.description.toLowerCase().includes(search.toLowerCase()),
                )
            }

            return Promise.resolve(products)
        }

        const params = new URLSearchParams()
        if (category) params.append("category", category)
        if (search) params.append("search", search)

        const response = await this.fetchWithTimeout(`${this.baseUrl}/products?${params}`)
        if (!response.ok) throw new Error("Failed to fetch products")
        return response.json()
    }

    // Cart API
    async getCart(userId: number): Promise<CartItem[]> {
        if (config.telegram.mockMode) {
            return Promise.resolve(mockCartItems.filter((item) => item.user_id === userId))
        }

        const response = await this.fetchWithTimeout(`${this.baseUrl}/cart?userId=${userId}`)
        if (!response.ok) throw new Error("Failed to fetch cart")
        return response.json()
    }

    async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
        if (config.telegram.mockMode) {
            const product = mockProducts.find((p) => p.id === productId)
            if (!product) throw new Error("Product not found")

            const cartItem: CartItem = {
                id: Date.now(),
                user_id: userId,
                product_id: productId,
                quantity,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                name: product.name,
                description: product.description,
                price: product.price,
                photos: product.photos,
                category: product.category,
            }

            return Promise.resolve(cartItem)
        }

        const response = await this.fetchWithTimeout(`${this.baseUrl}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, productId, quantity }),
        })

        if (!response.ok) throw new Error("Failed to add to cart")
        return response.json()
    }

    // Orders API
    async getOrders(userId: number): Promise<Order[]> {
        if (config.telegram.mockMode) {
            return Promise.resolve(mockOrders.filter((order) => order.user_id === userId))
        }

        const response = await this.fetchWithTimeout(`${this.baseUrl}/orders?userId=${userId}`)
        if (!response.ok) throw new Error("Failed to fetch orders")
        return response.json()
    }

    async createOrder(userId: number, deliveryAddress: string, phoneNumber: string, notes?: string): Promise<Order> {
        if (config.telegram.mockMode) {
            const newOrder: Order = {
                id: Date.now(),
                user_id: userId,
                total_amount: 25.0,
                status: "pending",
                delivery_address: deliveryAddress,
                phone_number: phoneNumber,
                notes: notes || "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                items: mockCartItems.map((item) => ({
                    id: item.id,
                    product: mockProducts.find((p) => p.id === item.product_id)!,
                    quantity: item.quantity,
                    price: item.price,
                })),
            }

            return Promise.resolve(newOrder)
        }

        const response = await this.fetchWithTimeout(`${this.baseUrl}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, deliveryAddress, phoneNumber, notes }),
        })

        if (!response.ok) throw new Error("Failed to create order")
        return response.json()
    }

    // Auth API
    async authenticateUser(initData: string): Promise<{ user: TelegramUser; success: boolean }> {
        if (config.telegram.mockMode) {
            return Promise.resolve({
                user: mockUser,
                success: true,
            })
        }

        const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/telegram`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
            credentials: 'include',
        })

        if (!response.ok) throw new Error("Authentication failed")
        return response.json()
    }

    // Likes API (mock support)
    async getLikesForProduct(productId: number, userId?: number): Promise<{ count: number; is_liked: boolean }> {
        if (this.useMock()) {
            const count = Object.values(mockLikes).reduce((sum, set) => sum + (set.has(productId) ? 1 : 0), 0)
            const is_liked = !!(userId && mockLikes[userId] && mockLikes[userId].has(productId))
            return Promise.resolve({ count, is_liked })
        }

        // Include credentials so session cookie (session_user) is sent with the request
        console.debug('[apiClient] GET /likes?productId=', productId)
        const response = await this.fetchWithTimeout(`${this.baseUrl}/likes?productId=${productId}`, {
            credentials: 'include',
        })
        if (!response.ok) throw new Error("Failed to fetch likes")
        return response.json()
    }

    async likeProduct(productId: number): Promise<{ count: number; is_liked: boolean }> {
        if (this.useMock()) {
            const uid = mockUser.id
            mockLikes[uid] = mockLikes[uid] || new Set()
            mockLikes[uid].add(productId)
            const count = Object.values(mockLikes).reduce((sum, set) => sum + (set.has(productId) ? 1 : 0), 0)
            return Promise.resolve({ count, is_liked: true })
        }

        console.debug('[apiClient] POST /likes', { productId })
        const response = await this.fetchWithTimeout(`${this.baseUrl}/likes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
            credentials: 'include',
        })

        if (!response.ok) throw new Error("Failed to like product")
        return response.json()
    }

    async unlikeProduct(productId: number): Promise<{ count: number; is_liked: boolean }> {
        if (this.useMock()) {
            const uid = mockUser.id
            mockLikes[uid] = mockLikes[uid] || new Set()
            mockLikes[uid].delete(productId)
            const count = Object.values(mockLikes).reduce((sum, set) => sum + (set.has(productId) ? 1 : 0), 0)
            return Promise.resolve({ count, is_liked: false })
        }

        console.debug('[apiClient] DELETE /likes', { productId })
        const response = await this.fetchWithTimeout(`${this.baseUrl}/likes?productId=${productId}`, {
            method: "DELETE",
            credentials: 'include',
        })

        if (!response.ok) throw new Error("Failed to unlike product")
        return response.json()
    }

    // Batch fetch counts for multiple product IDs
    async getCountsForProducts(productIds: number[]): Promise<Record<number, number>> {
        if (this.useMock()) {
            const map: Record<number, number> = {}
            productIds.forEach((id) => {
                map[id] = Object.values(mockLikes).reduce((sum, set) => sum + (set.has(id) ? 1 : 0), 0)
            })
            return Promise.resolve(map)
        }

        if (productIds.length === 0) return Promise.resolve({})
        const ids = productIds.join(',')
        console.debug('[apiClient] GET /likes?ids=', ids)
        const res = await this.fetchWithTimeout(`${this.baseUrl}/likes?ids=${ids}`)
        if (!res.ok) throw new Error('Failed to fetch like counts')
        const data = await res.json()
        return data.counts || {}
    }

    // Get liked product ids for current authenticated user
    async getLikedProductsForUser(): Promise<any[]> {
        if (this.useMock()) {
            const uid = mockUser.id
            const ids = Array.from(mockLikes[uid] || new Set())
            // return product objects
            return Promise.resolve(mockProducts.filter((p) => ids.includes(p.id)))
        }

        const res = await this.fetchWithTimeout(`${this.baseUrl}/likes`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to fetch liked products')
        return res.json()
    }
}

export const apiClient = new ApiClient()
