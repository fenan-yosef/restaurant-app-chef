"use client"

import { useEffect, useState } from "react"
import ProductCard from "@/components/ProductCard"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"

export default function LikedPage() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiClient.getLikedProductsForUser()
                setProducts(res)
            } catch (err) {
                console.error('Failed to load liked products', err)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [])

    // Keep list in sync when likes are toggled elsewhere (optimistic updates)
    useEffect(() => {
        const handler = (e: any) => {
            try {
                const detail = e.detail || {}
                const { productId, isLiked } = detail
                if (typeof productId !== 'number') return
                if (isLiked === false) {
                    setProducts((prev) => prev.filter((p) => p.id !== productId))
                }
            } catch (err) { }
        }
        if (typeof window !== 'undefined') window.addEventListener('likes-updated', handler)
        return () => { if (typeof window !== 'undefined') window.removeEventListener('likes-updated', handler) }
    }, [])

    if (isLoading) return <div className="p-6">Loading liked products...</div>

    if (products.length === 0) return <div className="p-6">You haven't liked any products yet.</div>

    const handleUnlike = async (productId: number) => {
        try {
            const res = await apiClient.unlikeProduct(productId)
            // remove from list
            setProducts((prev) => prev.filter((p) => p.id !== productId))
            // dispatch update so other components update counts
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('likes-updated', { detail: { productId, count: res.count, isLiked: false } }))
        } catch (err) {
            console.error('Failed to unlike', err)
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4">Products you liked</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <ProductCard
                        key={p.id}
                        product={p}
                        onAddToCart={() => { }}
                        onPlaceOrder={() => { }}
                        cartQuantity={0}
                        likeCount={null}
                        isLiked={true}
                    />
                ))}
            </div>
        </div>
    )
}
