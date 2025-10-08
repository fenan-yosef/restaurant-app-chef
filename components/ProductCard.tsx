"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Star, Package, DollarSign, ArrowLeft, ArrowRight } from "lucide-react"
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
    // imageLoaded indicates the currently-visible slide has loaded
    const [imageLoaded, setImageLoaded] = useState(false)
    // Carousel state
    const [currentIndex, setCurrentIndex] = useState(0)
    const touchStartX = useRef<number | null>(null)
    const touchDeltaX = useRef(0)
    const carouselRef = useRef<HTMLDivElement | null>(null)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false) // New state for description
    const { hapticFeedback } = useTelegram()

    const handleAddToCart = (e?: React.MouseEvent) => {
        // Prevent navigation when clicking this button (card is clickable)
        e?.stopPropagation()
        hapticFeedback("light")
        onAddToCart(product.id, 1)
    }

    const handlePlaceOrder = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        hapticFeedback("medium")
        onPlaceOrder(product.id, 1)
    }

    const handleLike = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setIsLiked(!isLiked)
        hapticFeedback("light")
    }

    // Use all photos if available, otherwise fallback to placeholder
    const photos = (product.photos && product.photos.length > 0) ? product.photos : ["/placeholder.svg"]
    const imageUrl = getImageUrl(product.photos)
    const priceNumber = Number.isNaN(Number(product.price)) ? product.price : Number(product.price)

    // Determine if this is a "new" product (added recently)
    // default threshold: 14 days
    const NEW_DAYS_THRESHOLD = 14
    const createdAt = product.created_at ? new Date(product.created_at) : null
    const isNew = createdAt ? (Date.now() - createdAt.getTime()) <= NEW_DAYS_THRESHOLD * 24 * 60 * 60 * 1000 : false

    const renderHighlightedText = (text: string) => {
        if (highlightText) {
            return <span dangerouslySetInnerHTML={{ __html: highlightText(text) }} />
        }
        return text
    }

    // Heuristic to determine if "See more" is needed
    const needsSeeMore = (product.description?.length || 0) > 150 // Adjust character limit as needed

    // Carousel helpers
    const next = () => setCurrentIndex((i) => (i + 1) % photos.length)
    const prev = () => setCurrentIndex((i) => (i - 1 + photos.length) % photos.length)

    // keyboard left/right
    useEffect(() => {
        const el = carouselRef.current
        if (!el) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") next()
            if (e.key === "ArrowLeft") prev()
        }
        el.addEventListener("keydown", onKey)
        return () => el.removeEventListener("keydown", onKey)
    }, [photos.length])

    // touch handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchDeltaX.current = 0
    }

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return
        const x = e.touches[0].clientX
        touchDeltaX.current = x - touchStartX.current
    }

    const onTouchEnd = () => {
        const delta = touchDeltaX.current
        if (Math.abs(delta) > 50) {
            if (delta < 0) next()
            else prev()
        }
        touchStartX.current = null
        touchDeltaX.current = 0
    }

    return (
        <Card
            className={cn(
                "group overflow-hidden animate-fade-in card-hover",
                "border border-transparent bg-card/90 dark:bg-card/80 shadow-lg hover:border-blue-100/60 dark:hover:border-slate-700",
                className,
            )}
        >
            <div
                className="relative overflow-hidden aspect-[4/3]"
                ref={carouselRef}
                tabIndex={0}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 animate-pulse" />
                )}

                {/* Slides */}
                <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                    {photos.map((p, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-full h-full">
                            <Image
                                src={p || "/placeholder.svg"}
                                alt={`${product.name} (${idx + 1})`}
                                fill
                                className={cn("object-cover transition-opacity duration-500", imageLoaded ? "opacity-100" : "opacity-0")}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                unoptimized
                                onLoad={() => setImageLoaded(true)}
                                loading={idx === currentIndex ? "eager" : "lazy"}
                            />
                            {/* Wrap image area with link so clicking image goes to detail page */}
                            {idx === currentIndex && (
                                <Link href={`/products/${product.id}`} className="absolute inset-0" aria-label={`View details for ${product.name}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Prev / Next controls for multi-image */}
                {photos.length > 1 && (
                    <>
                        {/* left overlay - larger hit area */}
                        <button
                            aria-label="Previous image"
                            onClick={prev}
                            className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-center px-2 focus:outline-none z-10"
                        >
                            <div className="hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-white/80 dark:bg-slate-800/70 shadow-md hover:scale-105 transition-transform">
                                <ArrowLeft className="h-5 w-5 text-slate-800 dark:text-white" />
                            </div>
                            <div className="sm:hidden absolute left-3 top-1/2 -translate-y-1/2 text-white text-2xl">‹</div>
                            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/20 to-transparent dark:from-white/5 pointer-events-none" />
                        </button>

                        {/* right overlay - larger hit area */}
                        <button
                            aria-label="Next image"
                            onClick={next}
                            className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-center px-2 focus:outline-none z-10"
                        >
                            <div className="hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-white/80 dark:bg-slate-800/70 shadow-md hover:scale-105 transition-transform">
                                <ArrowRight className="h-5 w-5 text-slate-800 dark:text-white" />
                            </div>
                            <div className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 text-white text-2xl">›</div>
                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/20 to-transparent dark:from-white/5 pointer-events-none" />
                        </button>

                        {/* indicators */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-2 z-10">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    aria-label={`Go to image ${i + 1}`}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "h-2 w-8 rounded-full transition-colors",
                                        i === currentIndex ? "bg-white dark:bg-slate-200" : "bg-white/40 dark:bg-slate-700/40",
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Overlay Elements */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1 z-30">
                    {cartQuantity > 0 && (
                        <Badge className="bg-green-500/90 backdrop-blur text-white animate-bounce shadow-lg">
                            {cartQuantity} in cart
                        </Badge>
                    )}
                    {isNew && <Badge className="bg-blue-600/90 text-white shadow">New</Badge>}
                </div>

                <div className="absolute top-2 right-2 flex flex-col space-y-1 items-end z-30">
                    <div className="rounded-full bg-black/55 backdrop-blur px-3 py-1 text-xs font-semibold text-white shadow-lg flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {typeof priceNumber === "number" ? priceNumber.toFixed(2) : priceNumber}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleLike(e)}
                        className={cn(
                            "h-8 w-8 rounded-full bg-white/80 backdrop-blur transition-all duration-300",
                            "hover:bg-white hover:scale-110 dark:bg-slate-800/80 dark:hover:bg-slate-800",
                            isLiked && "text-red-500",
                        )}
                    >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                    </Button>
                </div>

                {/* Gradient Overlay (non-blocking) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        <Link href={`/products/${product.id}`} className="inline-block hover:underline">
                            {renderHighlightedText(product.name)}
                        </Link>
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
                        onClick={(e) => { e.stopPropagation(); setIsDescriptionExpanded(!isDescriptionExpanded) }}
                        className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:no-underline"
                    >
                        {isDescriptionExpanded ? "See less" : "See more"}
                    </Button>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <div className="flex w-full gap-2">
                    <Button
                        onClick={(e) => handleAddToCart(e)}
                        variant="outline"
                        className="flex-1 group/button relative overflow-hidden bg-transparent border-slate-300/70 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                    <Button
                        onClick={(e) => handlePlaceOrder(e)}
                        className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:via-indigo-500 hover:to-fuchsia-500 shadow-md shadow-blue-500/20"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        Order
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
