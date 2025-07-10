"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Order } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { useTelegram } from "@/hooks/useTelegram"
import OrderCard from "@/components/OrderCard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package } from "lucide-react"

export default function OrdersPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { showBackButton, hideMainButton } = useTelegram()

    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        showBackButton(() => router.push("/"))
        hideMainButton()
    }, [showBackButton, hideMainButton, router])

    // Fetch orders
    useEffect(() => {
        const fetchOrders = async () => {
            if (user) {
                try {
                    const response = await fetch(`/api/orders?userId=${user.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        setOrders(data)
                    }
                } catch (error) {
                    console.error("Failed to fetch orders:", error)
                } finally {
                    setIsLoading(false)
                }
            }
        }

        fetchOrders()
    }, [user])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                <p className="text-gray-600 text-center mb-6">
                    Your order history will appear here once you place your first order.
                </p>
                <Button onClick={() => router.push("/")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Start Shopping
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold">📦 Your Orders</h1>
                    <p className="text-sm text-gray-600">
                        {orders.length} order{orders.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Orders List */}
            <div className="p-4 space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        </div>
    )
}
