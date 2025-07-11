/**
 * Environment Configuration System
 *
 * This module provides a centralized configuration system that automatically
 * switches between development and production environments based on NODE_ENV.
 *
 * Usage:
 * import { config } from '@/lib/config'
 * const apiUrl = config.api.baseUrl
 */

export interface AppConfig {
    app: {
        name: string
        version: string
        url: string
        isDevelopment: boolean
        isProduction: boolean
    }
    api: {
        baseUrl: string
        timeout: number
        retries: number
    }
    database: {
        url: string
        ssl: boolean
        poolSize: number
    }
    telegram: {
        botToken: string
        webhookSecret?: string
        mockMode: boolean
        mockUser: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
        }
        logChatId?: string // Added for Telegram logging
    }
    features: {
        enableAuth: boolean
        enablePayments: boolean
        enableAnalytics: boolean
        enableLogging: boolean // Added for logging control
    }
    ui: {
        theme: "light" | "dark" | "auto"
        showDebugInfo: boolean
        enableHapticFeedback: boolean
    }
}

// Environment-specific configurations
const developmentConfig: Partial<AppConfig> = {
    app: {
        name: "Artisan Bakery (Dev)",
        version: "1.0.0-dev",
        url: "http://localhost:3000",
        isDevelopment: true,
        isProduction: false,
    },
    api: {
        baseUrl: "http://localhost:3000/api",
        timeout: 10000,
        retries: 3,
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "dev-token",
        mockMode: true,
        mockUser: {
            id: 12345,
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            language_code: "en",
        },
        logChatId: process.env.TELEGRAM_LOG_CHAT_ID, // Use env var for dev logs
    },
    features: {
        enableAuth: true,
        enablePayments: false,
        enableAnalytics: false,
        enableLogging: false
    },
    ui: {
        theme: "light",
        showDebugInfo: true,
        enableHapticFeedback: false,
    },
}

const productionConfig: Partial<AppConfig> = {
    app: {
        name: "Artisan Bakery",
        version: "1.0.0",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app",
        isDevelopment: false,
        isProduction: true,
    },
    api: {
        baseUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api`,
        timeout: 30000,
        retries: 2,
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
        mockMode: false,
        mockUser: {
            id: 0,
            first_name: "",
        },
        logChatId: process.env.TELEGRAM_LOG_CHAT_ID, // Use env var for prod logs
    },
    features: {
        enableAuth: true,
        enablePayments: true,
        enableAnalytics: true,
        enableLogging: false
    },
    ui: {
        theme: "auto",
        showDebugInfo: false,
        enableHapticFeedback: true,
    },
}

// Base configuration with defaults
const baseConfig: AppConfig = {
    app: {
        name: "Artisan Bakery",
        version: "1.0.0",
        url: "",
        isDevelopment: false,
        isProduction: false,
    },
    api: {
        baseUrl: "/api",
        timeout: 15000,
        retries: 2,
    },
    database: {
        url: process.env.DATABASE_URL || "",
        ssl: process.env.NODE_ENV === "production",
        poolSize: process.env.NODE_ENV === "production" ? 20 : 5,
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        mockMode: false,
        mockUser: {
            id: 0,
            first_name: "",
        },
    },
    features: {
        enableAuth: true,
        enablePayments: false,
        enableAnalytics: false,
        enableLogging: process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true", // Directly controlled by NEXT_PUBLIC_ENABLE_LOGGING
    },
    ui: {
        theme: "auto",
        showDebugInfo: false,
        enableHapticFeedback: true,
    },
}

// Merge configurations based on environment
function createConfig(): AppConfig {
    const isDevelopment = process.env.NODE_ENV === "development"
    const envConfig = isDevelopment ? developmentConfig : productionConfig

    return {
        ...baseConfig,
        ...envConfig,
        app: { ...baseConfig.app, ...envConfig.app },
        api: { ...baseConfig.api, ...envConfig.api },
        database: { ...baseConfig.database },
        telegram: { ...baseConfig.telegram, ...envConfig.telegram },
        // Merge features separately to ensure NEXT_PUBLIC_ENABLE_LOGGING takes precedence
        features: {
            ...baseConfig.features,
            ...envConfig.features,
            enableLogging: process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true",
        },
        ui: { ...baseConfig.ui, ...envConfig.ui },
    }
}

export const config = createConfig()

// Utility functions for environment checking
export const isDevelopment = () => config.app.isDevelopment
export const isProduction = () => config.app.isProduction

// Configuration validation
export function validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.database.url) {
        errors.push("DATABASE_URL is required")
    }

    if (config.app.isProduction && !config.telegram.botToken) {
        errors.push("TELEGRAM_BOT_TOKEN is required in production")
    }

    if (config.app.isProduction && !config.app.url) {
        errors.push("NEXT_PUBLIC_APP_URL is required in production")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

// Debug helper
export function logConfig() {
    if (config.ui.showDebugInfo) {
        console.group("🔧 App Configuration")
        console.log("Environment:", config.app.isDevelopment ? "Development" : "Production")
        console.log("App URL:", config.app.url)
        console.log("API Base URL:", config.api.baseUrl)
        console.log("Telegram Mock Mode:", config.telegram.mockMode)
        console.log("Features:", config.features)
        console.groupEnd()
    }
}
