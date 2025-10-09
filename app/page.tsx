"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Product, CartItem } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { useTelegram } from "@/hooks/useTelegram"
import ProductCard from "@/components/ProductCard"
import AdvancedSearch from "@/components/AdvancedSearch"
import ProductGridSkeleton from "@/components/LoadingStates/ProductGridSkeleton"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ShoppingCart, Clock, Sparkles, TrendingUp, Shield } from "lucide-react" // Import Shield icon
import { formatCurrency, toNumber } from "@/lib/utils"
import { config } from "@/lib/config" // Ensure config is imported
import { useDebounce } from "@/hooks/useDebounce"

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, isGuest } = useAuth()
  const {
    hapticFeedback,
    showMainButton,
    hideMainButton,
    webApp,
    user: telegramUser,
    isLoading: telegramLoading,
  } = useTelegram() // Get webApp and telegramUser from useTelegram

  const [visibleCount, setVisibleCount] = useState(20) // render first 20 products
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
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
  // Filters state (server-driven)
  const [filters, setFilters] = useState<any>({
    query: "",
    category: "",
    design: "",
    flavor: "",
    occasion: "",
    size: "",
    sortBy: "created_at",
    sortOrder: "desc",
  })
  const debouncedQuery = useDebounce(filters.query || "", 300)
  const [isFetching, setIsFetching] = useState(false)

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
    // reset visible count to page start when filters change
    setVisibleCount(20)
  }

  const clearFilters = () => {
    setFilters({ query: "", category: "", design: "", flavor: "", occasion: "", size: "", sortBy: "created_at", sortOrder: "desc" })
    setVisibleCount(20)
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`, "ig")
    return text.replace(regex, (m) => `<mark>${m}</mark>`)
  }

  const isSearching = debouncedQuery !== (filters.query || "")

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

  // Fetch products from server according to filters (debounced for query)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetching(true)
      try {
        const params = new URLSearchParams()
        if (filters.category) params.set("category", filters.category)
        if (filters.design) params.set("design", filters.design)
        if (filters.flavor) params.set("flavor", filters.flavor)
        if (filters.occasion) params.set("occasion", filters.occasion)
        if (filters.size) params.set("size", filters.size)
        if (debouncedQuery) params.set("search", debouncedQuery)
        if (filters.sortBy) params.set("sortBy", filters.sortBy)
        if (filters.sortOrder) params.set("sortOrder", filters.sortOrder)
        // request a larger page so infinite scroll works client-side
        params.set("limit", String(Math.max(48, visibleCount)))

        const response = await fetch(`/api/products?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          const products = data.products || data
          setAllProducts(products)
          setFilteredProducts(products)
        } else {
          console.error("Failed to fetch products: status", response.status)
          setAllProducts([])
          setFilteredProducts([])
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
        setAllProducts([])
        setFilteredProducts([])
      } finally {
        setIsFetching(false)
        setIsLoading(false)
      }
    }

    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters.category, filters.design, filters.flavor, filters.occasion, filters.size, filters.sortBy, filters.sortOrder])

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      if (user && Number(user.id) > 0) {
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

    // If this is a browser guest session (negative id / explicit guest), keep local only
    if (Number(user.id) < 0 || isGuest) {
      // Let client-side cart logic handle local storage (useCart hook)
      // But for this top-level page we simply show a friendly message and return
      try {
        hapticFeedback('light')
        // dispatch a custom event so header badge may update via local cart
        window.dispatchEvent(new CustomEvent('cart-optimistic', { detail: { delta: quantity } }))
        // We don't have direct access to useCart here; rely on local events and localStorage
        return
      } catch (e) {
        return
      }
    }

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
  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return
    const el = loadMoreRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + 16, filteredProducts.length))
          }
        })
      },
      { rootMargin: "600px 0px 0px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filteredProducts.length])

  // console.log("============")

  // console.log("USER", user)
  // console.log("ADMIN ID", user ? config.app.adminChatIds.includes(Number(user.id)) : false)


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

  // Display authentication prompt only when client is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-6 max-w-md">
          <div className="text-6xl animate-bounce">🥖</div>
          <h1 className="text-3xl font-bold gradient-text">Welcome to Chef Figoz Bakery!</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Please open this app through Telegram to continue your delicious journey.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                // Add guest=1 to the URL and reload so useAuth picks up the browser fallback
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href)
                  url.searchParams.set("guest", "1")
                  window.location.href = url.toString()
                }
              }}
            >
              Continue in browser
            </Button>
          </div>
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
    <div className="min-h-screen mx-auto max-w-[1450px] px-2 sm:px-4">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-200/70 dark:border-slate-700/60">
        <div className="px-2 sm:px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight gradient-text flex items-center">
                  🥖 Chef Figoz Bakery
                </h1>
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                  <TrendingUp className="h-3 w-3 mr-1" /> Fresh
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Welcome back, <span className="font-medium text-blue-600 dark:text-blue-400">{user?.first_name}</span>! ✨</p>
            </div>
            <div className="flex space-x-2 self-start md:self-auto">
              <Button
                variant={isAdmin ? "outline" : "ghost"}
                size="sm"
                onClick={() => router.push("/admin")}
                className={`transition-all duration-200 hover:scale-105 rounded-lg shadow-sm ${!isAdmin ? "opacity-60" : ""}`}
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/orders")}
                className="transition-all duration-200 hover:scale-105 rounded-lg shadow-sm"
              >
                <Clock className="h-4 w-4 mr-1" />
                Orders
              </Button>
              <Button asChild variant="outline" size="sm" className="relative transition-all duration-200 hover:scale-105 rounded-lg shadow-sm">
                <Link id="cart-icon" href="/cart" className="inline-flex items-center relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 p-0 text-xs animate-pulse bg-red-500 text-white rounded-full font-semibold">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="px-2 sm:px-4 py-6">
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
      <div className="px-1 sm:px-2 md:px-4 pb-12">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <>
            {/* Results Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold">{filters.query ? "Search Results" : "Our Delicious Products"}</h2>
                    <Badge variant="secondary" className="animate-scale-in">
                      {filteredProducts.length} items
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={filters.category || ""}
                      onChange={(e) => updateFilter("category", e.target.value)}
                      className="h-9 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3"
                    >
                      <option value="">All categories</option>
                      {availableFilters.categories.map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      value={filters.sortBy}
                      onChange={(e) => updateFilter("sortBy", e.target.value)}
                      className="h-9 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3"
                    >
                      <option value="created_at">Newest</option>
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                    </select>

                    <select
                      value={filters.sortOrder}
                      onChange={(e) => updateFilter("sortOrder", e.target.value)}
                      className="h-9 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3"
                    >
                      <option value="desc">Desc</option>
                      <option value="asc">Asc</option>
                    </select>

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
                </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-6xl opacity-50">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                  No products found
                </h3>
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
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredProducts.slice(0, visibleCount).map((product, index) => (
                    <div key={product.id} style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        onPlaceOrder={handlePlaceOrder}
                        cartQuantity={getCartQuantity(product.id)}
                        highlightText={filters.query ? ((text: string) => highlightText(text, filters.query)) : undefined}
                        className="animate-fade-in"
                      />
                    </div>
                  ))}
                  {/* Only include the observer element if more products are available */}
                  {visibleCount < filteredProducts.length && <div ref={loadMoreRef} />}
                </div>

                {visibleCount < filteredProducts.length ? (
                  <div className="text-center mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">
                      Loading more products...
                    </p>
                  </div>
                ) : (
                  <div className="text-center mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold">
                      You've seen all our delicious products! 🎉
                    </h3>
                    <p className="text-sm text-gray-400">
                      Check back soon for new additions to our menu
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom padding for main button */}
      <div className="h-20"></div>
    </div>
  )
}
