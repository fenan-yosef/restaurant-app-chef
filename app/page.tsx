"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Product, CartItem } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { useTelegram } from "@/hooks/useTelegram"
import ProductCard from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Search, Clock } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { hapticFeedback, showMainButton, hideMainButton } = useTelegram()

  const [products, setProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (response.ok) {
          const data = await response.json()
          setProducts(data)

          // Extract unique categories
          const uniqueCategories = [...new Set(data.map((p: Product) => p.category).filter(Boolean))] as string[]
          setCategories(uniqueCategories)
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
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    if (totalItems > 0) {
      showMainButton(`View Cart (${totalItems}) - $${totalAmount.toFixed(2)}`, () => router.push("/cart"))
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

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCartQuantity = (productId: number) => {
    const cartItem = cartItems.find((item) => item.product_id === productId)
    return cartItem ? cartItem.quantity : 0
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Our Bakery!</h1>
        <p className="text-gray-600 text-center mb-4">Please open this app through Telegram to continue.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">🥖 Artisan Bakery</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.first_name}!</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/orders")}>
                <Clock className="h-4 w-4 mr-1" />
                Orders
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/cart")} className="relative">
                <ShoppingCart className="h-4 w-4" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b">
        <div className="px-4 py-3">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                cartQuantity={getCartQuantity(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom padding for main button */}
      <div className="h-20"></div>
    </div>
  )
}
