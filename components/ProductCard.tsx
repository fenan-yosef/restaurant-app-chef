"use client"

import { useState } from "react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"

interface ProductCardProps {
    product: Product
    onAddToCart: (productId: number, quantity: number) => void
    cartQuantity?: number
}

export default function ProductCard({ product, onAddToCart, cartQuantity = 0 }: ProductCardProps) {
    const [quantity, setQuantity] = useState(1)
    const { hapticFeedback } = useTelegram()

    const handleAddToCart = () => {
        hapticFeedback("light")
        onAddToCart(product.id, quantity)
    }

    const handleQuantityChange = (delta: number) => {
        const newQuantity = Math.max(1, quantity + delta)
        setQuantity(newQuantity)
        hapticFeedback("light")
    }

    const imageUrl =
        product.photos && product.photos.length > 0 ? product.photos[0] : `/placeholder.svg?height=200&width=200`

    return (
        <Card className="overflow-hidden">
            <div className="relative h-48">
                <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {cartQuantity > 0 && <Badge className="absolute top-2 right-2 bg-green-500">{cartQuantity} in cart</Badge>}
            </div>

            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    <Badge variant="secondary">{product.category}</Badge>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium min-w-[2rem] text-center">{quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button onClick={handleAddToCart} className="flex-1 ml-4">
                        Add to Cart
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
