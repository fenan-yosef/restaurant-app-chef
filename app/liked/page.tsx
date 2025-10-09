"use client"

import { useEffect, useState, useMemo } from "react"
import ProductCard from "@/components/ProductCard"
import ProductGridSkeleton from "@/components/LoadingStates/ProductGridSkeleton"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, Trash2, Search } from "lucide-react"

export default function LikedPage() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filterText, setFilterText] = useState("")
    const router = useRouter()

    const guestKey = typeof window !== 'undefined' ? `liked_products_${window.location.hostname}` : null

    const loadLiked = async (opts: { force?: boolean } = {}) => {
        setError(null)
        if (!opts.force) setIsLoading(true)
        try {
            // Attempt server-backed fetch first (works when authenticated)
            const res = await apiClient.getLikedProductsForUser()
            setProducts(res)
        } catch (err: any) {
            console.warn('getLikedProductsForUser failed, falling back to guest/local', err)
            // Fallback for guests: use localStorage ids then fetch products and filter
            try {
                if (guestKey && typeof window !== 'undefined') {
                    const raw = localStorage.getItem(guestKey)
                    const ids = raw ? (JSON.parse(raw) as number[]) : []
                    if (ids.length === 0) {
                        setProducts([])
                    } else {
                        // fetch all products and filter locally (small dataset in this app)
                        const all = await apiClient.getProducts()
                        const filtered = all.filter((p: any) => ids.includes(p.id))
                        setProducts(filtered)
                    }
                } else {
                    setProducts([])
                }
            } catch (err2) {
                console.error('Failed to load fallback liked products', err2)
                setError('Failed to load liked products')
            }
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => { loadLiked() }, [])

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

    const filtered = useMemo(() => {
        if (!filterText) return products
        const q = filterText.toLowerCase()
        return products.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }, [products, filterText])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await loadLiked({ force: true })
    }

    const handleClearAll = async () => {
        if (!confirm('Remove all liked products? This cannot be undone.')) return
        setIsClearing(true)
        try {
            // If authenticated, call unlike for each product; otherwise clear localStorage
            try {
                for (const p of products) {
                    await apiClient.unlikeProduct(p.id)
                }
            } catch (err) {
                // if server calls failed, fallback to clearing local storage for guest
                console.warn('clearAll: server unlike failed or unauthenticated, clearing local storage', err)
                if (guestKey && typeof window !== 'undefined') localStorage.removeItem(guestKey)
            }
            setProducts([])
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('likes-updated', { detail: { productId: null, count: 0, isLiked: false } }))
        } catch (err) {
            console.error('Failed to clear likes', err)
            setError('Failed to clear likes')
        } finally {
            setIsClearing(false)
        }
    }

    if (isLoading) return <div className="p-4"><ProductGridSkeleton count={6} /></div>

    return (
        <div className="p-4">
            {/* Top nav */}
            <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="px-2">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold flex-1">Products you liked</h1>

                <div className="hidden sm:flex items-center gap-2">
                    <div className="flex items-center border rounded-md overflow-hidden">
                        <Input placeholder="Search liked products" value={filterText} onChange={(e: any) => setFilterText(e.target.value)} className="h-8" />
                        <div className="px-2"><Search className="h-4 w-4 text-gray-500" /></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={isClearing}>
                        <Trash2 className="h-4 w-4 mr-1" /> Clear All
                    </Button>
                </div>
            </div>

            {/* Error */}
            {error && <div className="mb-4 text-red-600">{error}</div>}

            {/* Mobile search & actions */}
            <div className="sm:hidden mb-4 flex gap-2">
                <Input placeholder="Search liked" value={filterText} onChange={(e: any) => setFilterText(e.target.value)} />
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}><RefreshCw /></Button>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <div className="p-6 text-center">
                    <p className="text-lg font-medium">No liked products found</p>
                    <p className="text-sm text-gray-500 mt-2">Try liking some products or refresh the list.</p>
                    <div className="mt-4 flex justify-center">
                        <Button onClick={() => router.push('/products')}>Browse products</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p) => (
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
            )}
        </div>
    )
}
