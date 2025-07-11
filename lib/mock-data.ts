/**
 * Mock Data for Development Environment
 *
 * This module provides realistic mock data for testing the application
 * locally without requiring a full production setup.
 */

import type { Product, CartItem, Order, TelegramUser } from "@/lib/types"

export const mockUser: TelegramUser = {
    photo_url: "",
    id: 12345,
    first_name: "John",
    last_name: "Doe",
    username: "johndoe",
    language_code: "en",
    is_premium: false,
}

export const mockProducts: Product[] = [
    {
        id: 1,
        name: "Artisan Sourdough Bread",
        description:
            "Freshly baked sourdough with a perfect crust and soft interior. Made with traditional fermentation methods.",
        price: 8.5,
        category: "Bread",
        photos: ["/placeholder.svg?height=300&width=300"],
        videos: [],
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        name: "Chocolate Croissant",
        description: "Buttery, flaky croissant filled with rich dark chocolate. Perfect for breakfast or afternoon treat.",
        price: 4.25,
        category: "Pastries",
        photos: ["/placeholder.svg?height=300&width=300"],
        videos: [],
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        name: "Blueberry Muffin",
        description: "Moist and fluffy muffin packed with fresh blueberries and a hint of lemon zest.",
        price: 3.75,
        category: "Muffins",
        photos: ["/placeholder.svg?height=300&width=300"],
        videos: [],
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        name: "Red Velvet Cake",
        description: "Classic red velvet cake with cream cheese frosting. Perfect for special occasions.",
        price: 25.0,
        category: "Cakes",
        photos: ["/placeholder.svg?height=300&width=300"],
        videos: [],
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 5,
        name: "Cinnamon Roll",
        description: "Warm, gooey cinnamon roll with vanilla glaze. Made fresh daily.",
        price: 5.5,
        category: "Pastries",
        photos: ["/placeholder.svg?height=300&width=300"],
        videos: [],
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 6,
        name: "Whole Wheat Bread",
        description: "Healthy whole wheat bread made with organic flour and seeds.",
        price: 7.0,
        category: "Bread",
        photos: ["/placeholder.svg?height=300&width=300"],
        videos: [],
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
]

export const mockCartItems: CartItem[] = [
    {
        id: 1,
        user_id: 12345,
        product_id: 1,
        quantity: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: "Artisan Sourdough Bread",
        description: "Freshly baked sourdough with a perfect crust and soft interior.",
        price: 8.5,
        photos: ["/placeholder.svg?height=300&width=300"],
        category: "Bread",
    },
]

export const mockOrders: Order[] = [
    {
        id: 1,
        user_id: 12345,
        total_amount: 17.0,
        status: "delivered",
        delivery_address: "123 Main St, City, State 12345",
        phone_number: "+1234567890",
        notes: "Please ring the doorbell",
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        items: [
            {
                id: 1,
                product: mockProducts[0],
                quantity: 2,
                price: 8.5,
            },
        ],
    },
    {
        id: 2,
        user_id: 12345,
        total_amount: 12.5,
        status: "preparing",
        delivery_address: "123 Main St, City, State 12345",
        phone_number: "+1234567890",
        notes: "",
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updated_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        items: [
            {
                id: 2,
                product: mockProducts[1],
                quantity: 2,
                price: 4.25,
            },
            {
                id: 3,
                product: mockProducts[2],
                quantity: 1,
                price: 3.75,
            },
        ],
    },
]
