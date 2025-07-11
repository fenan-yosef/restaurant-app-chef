"use client"

import { useState } from "react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Star, Package } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"
import { getImageUrl } from "@/lib/product-parser"
import { cn } from "@/lib/utils"

interface ProductCardProps {
    product: Product
    onAddToCart: (productId: number, quantity: number) => void
    onPlaceOrder: (productId: number, quantity: number) => void
    cartQuantity?: number
    highlightText?: (text: string) => string
    className?: string
}

export default function ProductCard({
    product,
    onAddToCart,
    onPlaceOrder,
    cartQuantity = 0,
    highlightText,
    className,
}: ProductCardProps) {
    const [isLiked, setIsLiked] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false) // New state for description
    const { hapticFeedback } = useTelegram()

    const handleAddToCart = () => {
        hapticFeedback("light")
        onAddToCart(product.id, 1)
    }

    const handlePlaceOrder = () => {
        hapticFeedback("medium")
        onPlaceOrder(product.id, 1)
    }

    const handleLike = () => {
        setIsLiked(!isLiked)
        hapticFeedback("light")
    }

    const imageUrl = getImageUrl(product.photos)
    console.log('++++++++++++')
    console.log(imageUrl)

    const renderHighlightedText = (text: string) => {
        if (highlightText) {
            return <span dangerouslySetInnerHTML={{ __html: highlightText(text) }} />
        }
        return text
    }

    // Heuristic to determine if "See more" is needed
    const needsSeeMore = (product.description?.length || 0) > 150 // Adjust character limit as needed

    return (
        <Card
            className={cn(
                "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fade-in card-hover",
                "border-0 shadow-md bg-white dark:bg-gray-800",
                className,
            )}
        >
            <div className="relative h-48 overflow-hidden">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
                )}
                <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className={cn(
                        "object-cover transition-all duration-500 group-hover:scale-110",
                        imageLoaded ? "opacity-100" : "opacity-0",
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Overlay Elements */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                    {cartQuantity > 0 && (
                        <Badge className="bg-green-500 text-white animate-bounce shadow-lg">{cartQuantity} in cart</Badge>
                    )}
                    <Badge className="bg-blue-500 text-white shadow-lg">New</Badge>
                </div>

                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn(
                            "h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm transition-all duration-200",
                            "hover:bg-white hover:scale-110 dark:bg-gray-800/80 dark:hover:bg-gray-800",
                            isLiked && "text-red-500",
                        )}
                    >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                    </Button>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {renderHighlightedText(product.name)}
                    </h3>
                    <Badge variant="secondary" className="shrink-0 ml-2 dark:bg-gray-700">
                        {product.category}
                    </Badge>
                </div>

                {/* Product Attributes */}
                <div className="flex flex-wrap gap-1">
                    {product.design && (
                        <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                        >
                            🎨 {product.design}
                        </Badge>
                    )}
                    {product.flavor && (
                        <Badge
                            variant="outline"
                            className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
                        >
                            🍽️ {product.flavor}
                        </Badge>
                    )}
                    {product.occasion && (
                        <Badge
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                        >
                            🎉 {product.occasion}
                        </Badge>
                    )}
                    {product.size && (
                        <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                        >
                            📏 {product.size}
                        </Badge>
                    )}
                </div>

                {/* Rating (Mock) */}
                <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn("h-4 w-4", i < 4 ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600")}
                        />
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">(4.0)</span>
                </div>

                {/* Description Preview with "See More" */}
                <p className={cn("text-sm text-gray-600 dark:text-gray-400", !isDescriptionExpanded && "line-clamp-2")}>
                    {renderHighlightedText(product.description || "Delicious bakery item made with love and care.")}
                </p>
                {needsSeeMore && (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:no-underline"
                    >
                        {isDescriptionExpanded ? "See less" : "See more"}
                    </Button>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 space-y-3">
                {/* Action Buttons */}
                <div className="flex space-x-2 w-full">
                    <Button
                        onClick={handleAddToCart}
                        variant="outline"
                        className="flex-1 transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 bg-transparent"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                    </Button>
                    <Button
                        onClick={handlePlaceOrder}
                        className="flex-1 transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        Order Now
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
