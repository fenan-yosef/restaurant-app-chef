"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { CartItem } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { useTelegram } from "@/hooks/useTelegram"
import CartItemComponent from "@/components/CartItem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { formatCurrency, toNumber } from "@/lib/utils"

export default function CartPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { hapticFeedback, showMainButton, hideMainButton, showBackButton } = useTelegram()

    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [notes, setNotes] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)

    useEffect(() => {
        showBackButton(() => router.push("/"))
        return () => hideMainButton()
    }, [showBackButton, hideMainButton, router])

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
                } finally {
                    setIsLoading(false)
                }
            }
        }

        fetchCart()
    }, [user])

    // Update main button
    useEffect(() => {
        const totalAmount = cartItems.reduce((sum, item) => sum + toNumber(item.price) * item.quantity, 0)
        const canPlaceOrder = cartItems.length > 0 && deliveryAddress.trim() && phoneNumber.trim()

        if (canPlaceOrder) {
            showMainButton(`Place Order - ${formatCurrency(totalAmount)}`, handlePlaceOrder)
        } else {
            hideMainButton()
        }
    }, [cartItems, deliveryAddress, phoneNumber, showMainButton, hideMainButton])

    const handleUpdateQuantity = async (productId: number, quantity: number) => {
        if (!user) return

        try {
            const response = await fetch("/api/cart", {
                method: "PUT",
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
                hapticFeedback("light")
                setCartItems((prev) => prev.map((item) => (item.product_id === productId ? { ...item, quantity } : item)))
            }
        } catch (error) {
            console.error("Failed to update cart:", error)
            hapticFeedback("error")
        }
    }

    const handleRemoveItem = async (productId: number) => {
        if (!user) return

        try {
            const response = await fetch(`/api/cart?userId=${user.id}&productId=${productId}`, {
                method: "DELETE",
            })

            if (response.ok) {
                hapticFeedback("success")
                setCartItems((prev) => prev.filter((item) => item.product_id !== productId))
            }
        } catch (error) {
            console.error("Failed to remove item:", error)
            hapticFeedback("error")
        }
    }

    const handlePlaceOrder = async () => {
        if (!user || isPlacingOrder) return

        setIsPlacingOrder(true)
        hapticFeedback("medium")

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    deliveryAddress,
                    phoneNumber,
                    notes,
                }),
            })

            if (response.ok) {
                hapticFeedback("success")
                router.push("/orders")
            } else {
                hapticFeedback("error")
            }
        } catch (error) {
            console.error("Failed to place order:", error)
            hapticFeedback("error")
        } finally {
            setIsPlacingOrder(false)
        }
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + toNumber(item.price) * item.quantity, 0)
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-600 text-center mb-6">Add some delicious bakery items to get started!</p>
                <Button onClick={() => router.push("/")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold">🛒 Your Cart</h1>
                    <p className="text-sm text-gray-600">
                        {totalItems} item{totalItems !== 1 ? "s" : ""} • {formatCurrency(totalAmount)}
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                    {cartItems.map((item) => (
                        <CartItemComponent
                            key={item.id}
                            item={item}
                            onUpdateQuantity={handleUpdateQuantity}
                            onRemove={handleRemoveItem}
                        />
                    ))}
                </div>

                {/* Order Details Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Delivery Address *</label>
                            <Textarea
                                placeholder="Enter your full delivery address..."
                                value={deliveryAddress}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeliveryAddress(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Phone Number *</label>
                            <Input
                                type="tel"
                                placeholder="Your phone number"
                                value={phoneNumber}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Special Instructions (Optional)</label>
                            <Textarea
                                placeholder="Any special requests or notes..."
                                value={notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal ({totalItems} items)</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span>Free</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom padding for main button */}
                <div className="h-20"></div>
            </div>
        </div>
    )
}
