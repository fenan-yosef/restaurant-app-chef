"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus, Trash2 } from "lucide-react"
import type { CartItem as CartItemType } from "@/lib/types"
import { useTelegram } from "@/hooks/useTelegram"

interface CartItemProps {
    item: CartItemType
    onUpdateQuantity: (productId: number, quantity: number) => void
    onRemove: (productId: number) => void
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const { hapticFeedback } = useTelegram()

    const handleQuantityChange = (delta: number) => {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) {
            hapticFeedback("warning")
            onRemove(item.product_id)
        } else {
            hapticFeedback("light")
            onUpdateQuantity(item.product_id, newQuantity)
        }
    }

    const handleRemove = () => {
        hapticFeedback("warning")
        onRemove(item.product_id)
    }

    const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : `/placeholder.svg?height=80&width=80`

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                    <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                            sizes="64px"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                        <p className="font-semibold text-green-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(-1)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium min-w-[2rem] text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleRemove}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
