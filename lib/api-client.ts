/**
 * API Client with Environment-Aware Configuration
 *
 * This module provides a centralized API client that automatically
 * switches between mock data (development) and real API calls (production).
 */

import { config } from "./config"
import { mockProducts, mockCartItems, mockOrders, mockUser } from "./mock-data"
import type { Product, CartItem, Order, TelegramUser } from "./types"

class ApiClient {
    private baseUrl: string
    private timeout: number

    constructor() {
        this.baseUrl = config.api.baseUrl
        this.timeout = config.api.timeout
    }

    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        try {
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
        })

        if (!response.ok) throw new Error("Authentication failed")
        return response.json()
    }
}

export const apiClient = new ApiClient()
