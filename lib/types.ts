export interface TelegramUser {
    photo_url: string | Blob | undefined
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
}

export interface TelegramWebApp {
    initData: string
    initDataUnsafe: {
        user?: TelegramUser
        chat_instance?: string
        chat_type?: string
        start_param?: string
    }
    version: string
    platform: string
    colorScheme: "light" | "dark"
    themeParams: {
        link_color: string
        button_color: string
        button_text_color: string
        secondary_bg_color: string
        hint_color: string
        bg_color: string
        text_color: string
    }
    isExpanded: boolean
    viewportHeight: number
    viewportStableHeight: number
    headerColor: string
    backgroundColor: string
    BackButton: {
        isVisible: boolean
        onClick: (callback: () => void) => void
        show: () => void
        hide: () => void
    }
    MainButton: {
        text: string
        color: string
        textColor: string
        isVisible: boolean
        isProgressVisible: boolean
        isActive: boolean
        setText: (text: string) => void
        onClick: (callback: () => void) => void
        show: () => void
        hide: () => void
        enable: () => void
        disable: () => void
        showProgress: (leaveActive?: boolean) => void
        hideProgress: () => void
    }
    HapticFeedback: {
        impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void
        notificationOccurred: (type: "error" | "success" | "warning") => void
        selectionChanged: () => void
    }
    close: () => void
    expand: () => void
    ready: () => void
}

export interface Product {
    id: number
    name: string
    description: string
    price: string | number
    category: string
    photos: string[]
    videos: string[]
    design?: string
    flavor?: string
    occasion?: string
    size?: string
    post_id?: number
    is_available: boolean
    stock: number
    created_at: string
    updated_at: string
    // Optional fields added by APIs
    is_liked?: boolean
    like_count?: number
}

export interface ParsedProductInfo {
    title: string
    category: string
    design: string
    flavor: string
    occasion: string
    size: string
}

export interface ProductFilters {
    category?: string
    design?: string
    flavor?: string
    occasion?: string
    size?: string
    search?: string
    priceRange?: {
        min: number
        max: number
    }
}

// Updated CartItem interface to match database structure
export interface CartItem {
    id: number
    user_id: number
    product_id: number
    quantity: number
    created_at: string
    updated_at: string
    // Database join fields from products table
    name: string
    description: string
    price: string | number
    photos: string[]
    category: string
    design?: string
    flavor?: string
    occasion?: string
    size?: string
}

// Alternative interface for when we need the full product object
export interface CartItemWithProduct {
    id: number
    user_id: number
    product_id: number
    quantity: number
    created_at: string
    updated_at: string
    product: Product
}

export interface Order {
    id: number
    user_id: number
    total_amount: string | number
    status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
    delivery_address?: string
    phone_number?: string
    notes?: string
    created_at: string
    updated_at: string
    items: OrderItem[]
}

export interface OrderItem {
    id: number
    product: Product
    quantity: number
    price: string | number
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp
        }
    }
}
