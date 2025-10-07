"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus, Trash2 } from "lucide-react"
import type { CartItem as CartItemType } from "@/lib/types"
import { useTelegram } from "@/hooks/useTelegram"
import { formatCurrency, toNumber } from "@/lib/utils"

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

    // Convert price to number for calculations
    const priceNumber = toNumber(item.price)
    const totalPrice = priceNumber * item.quantity

    return (
        <Card className="border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200/70 dark:ring-slate-700/60">
                        <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm md:text-base">{item.name}</h4>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{formatCurrency(priceNumber)} each</p>
                        <p className="font-semibold text-green-600 dark:text-green-400 text-sm md:text-base">{formatCurrency(totalPrice)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(-1)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium min-w-[2rem] text-center tabular-nums text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleRemove}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
