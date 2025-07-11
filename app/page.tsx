"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Product, CartItem } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { useTelegram } from "@/hooks/useTelegram"
import ProductCard from "@/components/ProductCard"
import AdvancedSearch from "@/components/AdvancedSearch"
import ProductGridSkeleton from "@/components/LoadingStates/ProductGridSkeleton"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Clock, Sparkles, TrendingUp, Shield } from "lucide-react" // Import Shield icon
import { formatCurrency, toNumber } from "@/lib/utils"
import { config } from "@/lib/config" // Ensure config is imported
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch" // Declare the useAdvancedSearch hook

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    hapticFeedback,
    showMainButton,
    hideMainButton,
    webApp,
    user: telegramUser,
    isLoading: telegramLoading,
  } = useTelegram() // Get webApp and telegramUser from useTelegram

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    designs: [],
    flavors: [],
    occasions: [],
    sizes: [],
    priceRange: { min: 0, max: 100 },
  })
  const [isLoading, setIsLoading] = useState(true)

  // Advanced search hook
  const { filters, filteredProducts, updateFilter, clearFilters, highlightText, isSearching } = useAdvancedSearch({
    products: allProducts,
    initialFilters: {},
  })

  // Fetch available filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/filters")
        if (response.ok) {
          const data = await response.json()
          setAvailableFilters(data)
        }
      } catch (error) {
        console.error("Failed to fetch filters:", error)
      }
    }

    fetchFilters()
  }, [])

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=100") // Get more products initially
        if (response.ok) {
          const data = await response.json()
          setAllProducts(data.products || data) // Handle both paginated and non-paginated responses
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/cart?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setCartItems(data)
          }
        } catch (error) {
          console.error("Failed to fetch cart:", error)
        }
      }
    }

    fetchCart()
  }, [user])

  // Update main button based on cart
  useEffect(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = cartItems.reduce((sum, item) => sum + toNumber(item.price) * item.quantity, 0)

    if (totalItems > 0) {
      showMainButton(`🛒 View Cart (${totalItems}) - ${formatCurrency(totalAmount)}`, () => router.push("/cart"))
    } else {
      hideMainButton()
    }
  }, [cartItems, showMainButton, hideMainButton, router])

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!user) return

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          quantity,
        }),
      })

      if (response.ok) {
        hapticFeedback("success")
        // Refresh cart
        const cartResponse = await fetch(`/api/cart?userId=${user.id}`)
        if (cartResponse.ok) {
          const cartData = await cartResponse.json()
          setCartItems(cartData)
        }
      }
    } catch (error) {
      console.error("Failed to add to cart:", error)
      hapticFeedback("error")
    }
  }

  const handlePlaceOrder = async (productId: number, quantity: number) => {
    if (!user) return

    // Add to cart first, then redirect to cart for checkout
    await handleAddToCart(productId, quantity)
    router.push("/cart")
  }

  const getCartQuantity = (productId: number) => {
    const cartItem = cartItems.find((item) => item.product_id === productId)
    return cartItem ? cartItem.quantity : 0
  }

  const isAdmin = user && config.app.adminChatIds.includes(Number(user.id))
  console.log("============")

  console.log("USER", user)
  console.log("ADMIN ID", user ? config.app.adminChatIds.includes(Number(user.id)) : false)


  // --- DEBUGGING LOGS FOR HOME PAGE ---
  if (config.ui.showDebugInfo) {
    console.log("--- HomePage Debug ---")
    console.log("User ID:", user?.id)
    console.log("Is Authenticated:", isAuthenticated)
    console.log("Admin Chat IDs from config:", config.app.adminChatIds)
    console.log("Is current user ID in adminChatIds:", config.app.adminChatIds.includes(user?.id || 0))
    console.log("Final isAdmin status:", isAdmin)
    console.log("Auth Loading:", authLoading)
    console.log("Telegram Loading:", telegramLoading)
    console.log("-------------------------")
  }
  // --- END DEBUGGING LOGS ---
  // Show loading spinner while Telegram WebApp is initializing or auth is loading
  if (telegramLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your bakery experience...</p>
        </div>
      </div>
    )
  }

  // Display "Please open in Telegram" if telegramUser is NOT detected
  if (!telegramUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-6 max-w-md">
          <div className="text-6xl animate-bounce">🥖</div>
          <h1 className="text-3xl font-bold gradient-text">Welcome to Chef Figoz Bakery!</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Please open this app through Telegram to continue your delicious journey.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>Fresh • Delicious • Delivered</span>
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        {config.ui.showDebugInfo && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-800 text-white p-2 text-xs z-50 overflow-auto max-h-1/3">
            <h3 className="font-bold mb-1">DEBUG INFO (Telegram WebApp Not Detected)</h3>
            <p>Is Telegram WebApp available: {String(!!webApp)}</p>
            <p>Telegram User (from WebApp): {telegramUser ? JSON.stringify(telegramUser) : "N/A"}</p>
            <p>WebApp InitData: {webApp?.initData || "N/A"}</p>
            <p>WebApp InitDataUnsafe: {webApp?.initDataUnsafe ? JSON.stringify(webApp.initDataUnsafe) : "N/A"}</p>
            <p>Config Mock Mode: {String(config.telegram.mockMode)}</p>
            <p>Config Is Development: {String(config.app.isDevelopment)}</p>
          </div>
        )}
      </div>
    )
  }

  // If telegramUser is detected but server-side authentication failed (e.g., initData invalid)
  // This means the user is in Telegram, but our backend couldn't validate them.
  if (!isAuthenticated && !config.telegram.mockMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-6 max-w-md">
          <div className="text-6xl animate-bounce">⚠️</div>
          <h1 className="text-3xl font-bold gradient-text">Authentication Failed</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            We couldn't verify your Telegram session. Please ensure your bot is configured correctly in BotFather and
            try again.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>If the issue persists, contact support.</span>
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        {config.ui.showDebugInfo && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-800 text-white p-2 text-xs z-50 overflow-auto max-h-1/3">
            <h3 className="font-bold mb-1">DEBUG INFO (Server Auth Failed)</h3>
            <p>Is Telegram WebApp available: {String(!!webApp)}</p>
            <p>Telegram User (from WebApp): {telegramUser ? JSON.stringify(telegramUser) : "N/A"}</p>
            <p>WebApp InitData: {webApp?.initData || "N/A"}</p>
            <p>WebApp InitDataUnsafe: {webApp?.initDataUnsafe ? JSON.stringify(webApp.initDataUnsafe) : "N/A"}</p>
            <p>Config Mock Mode: {String(config.telegram.mockMode)}</p>
            <p>Config Is Development: {String(config.app.isDevelopment)}</p>
            <p>isAuthenticated: {String(isAuthenticated)}</p>
          </div>
        )}
      </div>
    )
  }

  // Main app content when authenticated
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass sticky top-0 z-10 border-b backdrop-blur-xl">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold gradient-text flex items-center">
                🥖 Chef Figoz Bakery
                <TrendingUp className="h-5 w-5 ml-2 text-green-500" />
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, <span className="font-medium text-blue-600">{user?.first_name}</span>! ✨
              </p>
            </div>
            <div className="flex space-x-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin")}
                  className="transition-all duration-200 hover:scale-105 glass"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/orders")}
                className="transition-all duration-200 hover:scale-105 glass"
              >
                <Clock className="h-4 w-4 mr-1" />
                Orders
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/cart")}
                className="relative transition-all duration-200 hover:scale-105 glass"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs animate-pulse bg-red-500">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="px-4 py-6">
        <AdvancedSearch
          filters={filters}
          onFiltersChange={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key as any, value)
            })
          }}
          availableFilters={availableFilters}
          isSearching={isSearching}
          resultsCount={filteredProducts.length}
        />
      </div>

      {/* Products Section */}
      <div className="px-4 pb-8">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold">{filters.query ? "Search Results" : "Our Delicious Products"}</h2>
                <Badge variant="secondary" className="animate-scale-in">
                  {filteredProducts.length} items
                </Badge>
              </div>

              {Object.keys(filters).some((key) => filters[key as keyof typeof filters] && key !== "sortBy" && key !== "sortOrder") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-6xl opacity-50">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No products found</h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                  {filters.query
                    ? `No products match "${filters.query}". Try adjusting your search terms or filters.`
                    : "No products match your current filters. Try adjusting your criteria."}
                </p>
                {Object.keys(filters).some((key) => filters[key as keyof typeof filters] && key !== "sortBy" && key !== "sortOrder") && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4 transition-all duration-200 hover:scale-105 bg-transparent"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Show All Products
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <div key={product.id} style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onPlaceOrder={handlePlaceOrder}
                      cartQuantity={getCartQuantity(product.id)}
                      highlightText={filters.query ? ((text: string) => highlightText(text, filters.query)) : undefined}
                      className={`animate-fade-in`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Load More Hint */}
            {filteredProducts.length > 0 && filteredProducts.length === allProducts.length && (
              <div className="text-center mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Sparkles className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">You've seen all our delicious products! 🎉</p>
                  <p className="text-sm text-gray-400">Check back soon for new additions to our menu</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom padding for main button */}
      <div className="h-20"></div>
    </div>
  )
}
