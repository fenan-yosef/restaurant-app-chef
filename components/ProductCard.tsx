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
import { useAuth } from "@/hooks/useAuth"
import { getImageUrl } from "@/lib/product-parser"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface ProductCardProps {
    product: Product
    onAddToCart: (productId: number, quantity: number) => void
    onPlaceOrder: (productId: number, quantity: number) => void
    cartQuantity?: number
    highlightText?: (text: string) => string
    className?: string
    likeCount?: number | null
    isLiked?: boolean
}

export default function ProductCard({
    product,
    onAddToCart,
    onPlaceOrder,
    cartQuantity = 0,
    highlightText,
    className,
    likeCount: initialLikeCount = null,
    isLiked: initialIsLiked = false,
}: ProductCardProps) {
    const router = useRouter()
    const { user: authUser, isAuthenticated } = useAuth()
    // If parent provides isLiked/likeCount use them as initial state
    const [isLiked, setIsLiked] = useState<boolean>(!!initialIsLiked)
    // imageLoaded indicates the currently-visible slide has loaded
    const [imageLoaded, setImageLoaded] = useState(false)
    const [likeCount, setLikeCount] = useState<number | null>(initialLikeCount ?? null)
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

    const handleLike = async (e?: React.MouseEvent) => {
        e?.stopPropagation()
        hapticFeedback("light")

        const prevLiked = isLiked
        const prevCount = likeCount

        // optimistic
        setIsLiked(!prevLiked)
        setLikeCount((c) => (c == null ? c : (prevLiked ? c - 1 : c + 1)))

        try {
            // use auth state from hook at component top (don't call hooks conditionally)
            if (isAuthenticated && authUser && Number(authUser.id) > 0) {
                // server-backed like/unlike
                if (!prevLiked) {
                    const res = await apiClient.likeProduct(product.id)
                    setLikeCount(res.count)
                    setIsLiked(true)
                    // notify page-level counts
                    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('likes-updated', { detail: { productId: product.id, count: res.count, isLiked: true } }))
                } else {
                    const res = await apiClient.unlikeProduct(product.id)
                    setLikeCount(res.count)
                    setIsLiked(false)
                    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('likes-updated', { detail: { productId: product.id, count: res.count, isLiked: false } }))
                }
            } else {
                // guest/local fallback using localStorage
                const guestKey = `liked_products_${typeof window !== 'undefined' ? window.location.hostname : 'local'}`
                const raw = typeof window !== 'undefined' ? localStorage.getItem(guestKey) : null
                const arr = raw ? JSON.parse(raw) as number[] : []
                const set = new Set(arr)
                if (!prevLiked) set.add(product.id)
                else set.delete(product.id)
                typeof window !== 'undefined' && localStorage.setItem(guestKey, JSON.stringify(Array.from(set)))
                // likeCount remains null for guests (no authoritative server count)
                // notify page-level counts for optimistic UI (guest local only)
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('likes-updated', { detail: { productId: product.id, count: likeCount, isLiked: !prevLiked } }))
            }
        } catch (err) {
            console.error('Failed to toggle like', err)
            // revert optimistic
            setIsLiked(prevLiked)
            setLikeCount(prevCount)
        }
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

    // fetch like state on mount
    useEffect(() => {
        let mounted = true
        const loadLikes = async () => {
            try {
                // If parent passed props, use them (they are authoritative for listing pages)
                if (typeof initialLikeCount === 'number') {
                    setLikeCount(initialLikeCount)
                }
                if (typeof initialIsLiked === 'boolean') {
                    setIsLiked(initialIsLiked)
                }

                // Only fetch from API if parent did not provide like info
                if (initialLikeCount == null && initialIsLiked == null) {
                    const cookieMatch = typeof document !== 'undefined' ? document.cookie.match(/session_user=([^;]+)/) : null
                    const uid = cookieMatch ? Number(cookieMatch[1]) : null
                    if (uid && uid > 0) {
                        const res = await apiClient.getLikesForProduct(product.id, uid)
                        if (!mounted) return
                        setLikeCount(res.count)
                        setIsLiked(!!res.is_liked)
                    } else if (typeof window !== 'undefined') {
                        const guestKey = `liked_products_${window.location.hostname}`
                        const raw = localStorage.getItem(guestKey)
                        const arr = raw ? JSON.parse(raw) as number[] : []
                        setLikeCount(null)
                        setIsLiked(arr.includes(product.id))
                    }
                }
            } catch (err) {
                console.error('Failed to load likes', err)
            }
        }

        loadLikes()
        return () => { mounted = false }
    }, [product.id])

    // Keep internal state aligned if parent updates props (e.g., listing pages)
    useEffect(() => {
        if (typeof initialLikeCount === 'number') setLikeCount(initialLikeCount)
    }, [initialLikeCount])

    useEffect(() => {
        if (typeof initialIsLiked === 'boolean') setIsLiked(initialIsLiked)
    }, [initialIsLiked])

    return (
        <Card
            onClick={() => router.push(`/products/${product.id}`)}
            className={cn(
                "group overflow-hidden animate-fade-in card-hover w-full max-w-full cursor-pointer",
                "border border-transparent bg-card/90 dark:bg-card/80 shadow-lg hover:border-blue-100/60 dark:hover:border-slate-700",
                className,
            )}
            role="button"
            aria-label={`Open ${product.name}`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(`/products/${product.id}`)
                }
            }}
        >
            <div
                className="relative overflow-hidden aspect-[3/2] sm:aspect-[4/3]"
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
                                className={cn(
                                    "transition-opacity duration-500 object-contain sm:object-cover",
                                    imageLoaded ? "opacity-100" : "opacity-0",
                                )}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                unoptimized
                                onLoad={() => setImageLoaded(true)}
                                loading={idx === currentIndex ? "eager" : "lazy"}
                            />
                            {/* Wrap image area with link so clicking image goes to detail page */}
                            {idx === currentIndex && (
                                <Link href={`/products/${product.id}`} className="absolute inset-0 z-0" aria-label={`View details for ${product.name}`}>
                                    <span className="sr-only">View details</span>
                                </Link>
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
                            onClick={(e) => { e.stopPropagation(); prev() }}
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
                            onClick={(e) => { e.stopPropagation(); next() }}
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
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i) }}
                                    className={cn(
                                        "h-2 w-8 rounded-full transition-colors",
                                        i === currentIndex ? "bg-white dark:bg-slate-200" : "bg-white/40 dark:bg-slate-700/40",
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Overlay Elements: small badges */}
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
                </div>

                {/* Gradient Overlay (non-blocking) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            <CardContent className="p-3 sm:p-4 space-y-3 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base sm:text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 min-w-0">
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

            <CardFooter className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex w-full gap-2 items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => handleLike(e)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md border bg-white/60 dark:bg-slate-900/60",
                                isLiked ? "text-red-500 border-red-200" : "text-gray-700 border-slate-200",
                            )}
                            aria-pressed={isLiked}
                        >
                            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                            <span className="text-sm">{likeCount ?? ""}</span>
                        </button>
                    </div>

                    <div className="flex-1">
                        <Button
                            onClick={(e) => handleAddToCart(e)}
                            variant="outline"
                            className="w-full group/button relative overflow-hidden bg-transparent border-slate-300/70 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add
                        </Button>
                    </div>

                    <div className="flex-1">
                        <Button
                            onClick={(e) => handlePlaceOrder(e)}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:via-indigo-500 hover:to-fuchsia-500 shadow-md shadow-blue-500/20"
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Order
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
