import { notFound } from "next/navigation"
import Image from "next/image"
import ProductGallery from "@/components/ProductGallery"
import ProductTopBar from "@/components/ProductTopBar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import ProductActions from "@/components/ProductActions"
import { DollarSign, Star } from "lucide-react"
import type { Product } from "@/lib/types"
import pool from "@/lib/database"

async function fetchProduct(id: string): Promise<Product | null> {
    try {
        const q = `SELECT id, name, description, price, category, photos, videos, design, flavor, occasion, size, post_id, is_available, stock, created_at, updated_at FROM products WHERE id = $1 LIMIT 1`
        const res = await pool.query(q, [id])
        if (!res || !res.rows || res.rows.length === 0) return null
        const row = res.rows[0]
        // Ensure photos/videos are arrays
        if (typeof row.photos === 'string') {
            try { row.photos = JSON.parse(row.photos) } catch { row.photos = [] }
        }
        if (typeof row.videos === 'string') {
            try { row.videos = JSON.parse(row.videos) } catch { row.videos = [] }
        }
        return row as Product
    } catch (e) {
        console.error('fetchProduct error', e)
        return null
    }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
    const { id } = params
    const product = await fetchProduct(id)
    if (!product) return notFound()

    const photos = (product.photos && product.photos.length) ? product.photos : ["/placeholder.svg"]

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Top navigation: back + title + cart */}
            <ProductTopBar title={product.name} />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7">
                    {/* Image gallery with thumbnails and autoplay */}
                    {/* ProductGallery is client-side and handles thumbnails + slideshow */}
                    <div>
                        <ProductGallery photos={photos} alt={product.name} intervalMs={5000} />
                    </div>

                    <Card className="mt-6">
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2">About this item</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {product.design && <Badge variant="outline">🎨 {product.design}</Badge>}
                                {product.flavor && <Badge variant="outline">🍽️ {product.flavor}</Badge>}
                                {product.occasion && <Badge variant="outline">🎉 {product.occasion}</Badge>}
                                {product.size && <Badge variant="outline">📏 {product.size}</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <aside className="md:col-span-5 space-y-4">
                    <div className="p-4 rounded-lg shadow-lg bg-white/90 dark:bg-slate-900/80">
                        <h1 className="text-2xl font-bold">{product.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="rounded-full bg-black/60 text-white px-3 py-1 inline-flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-semibold">{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} />))}
                                <span className="ml-2">(4.0)</span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <ProductActions product={product} />
                        </div>

                        <div className="mt-4 text-sm text-gray-600">
                            <p><strong>Availability:</strong> {product.is_available ? 'In stock' : 'Unavailable'}</p>
                            <p><strong>Stock:</strong> {product.stock}</p>
                            <p className="mt-2 text-xs text-gray-500">Added: {new Date(product.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <Card>
                        <CardContent>
                            <h4 className="font-semibold">Why customers love it</h4>
                            <ul className="text-sm mt-2 space-y-2 text-gray-700 dark:text-gray-300">
                                <li>• Freshly baked daily with premium ingredients.</li>
                                <li>• Beautiful presentation — perfect for celebrations.</li>
                                <li>• Customizable sizes and flavors on request.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <h4 className="font-semibold">Related</h4>
                            <p className="text-sm text-gray-700 mt-2">Check similar items in <a href="/" className="text-blue-600 underline">Products</a>.</p>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
