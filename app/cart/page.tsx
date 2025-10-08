"use client"

import { useEffect, useMemo, useState } from "react"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"

export default function CartPage() {
    const { user, isAuthenticated, isGuest } = useAuth()
    const { localItems, isLocalMode, updateLocalQuantity, removeLocalItem, addItem } = useCart()
    const router = useRouter()

    const [serverItems, setServerItems] = useState<any[]>([])
    const [loadingServer, setLoadingServer] = useState(false)

    // When authenticated (non-guest), fetch server cart
    useEffect(() => {
        const load = async () => {
            if (!isAuthenticated || isGuest || !user?.id || Number(user.id) <= 0) {
                setServerItems([])
                return
            }
            setLoadingServer(true)
            try {
                const res = await fetch(`/api/cart?userId=${user.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setServerItems(Array.isArray(data) ? data : [])
                }
            } catch (e) {
                // ignore
            } finally {
                setLoadingServer(false)
            }
        }
        load()
    }, [isAuthenticated, user, isGuest])

    const allItems = useMemo(() => {
        // If local mode, show local items; otherwise show serverItems
        return isLocalMode ? localItems.map(i => ({ ...i, _local: true })) : serverItems.map(i => ({ ...i, _local: false }))
    }, [isLocalMode, localItems, serverItems])

    const subtotal = allItems.reduce((s, it) => s + (Number(it.product?.price || it.price || 0) || 0) * (it.quantity || 0), 0)

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Nav */}
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></Link>
                <h1 className="text-2xl font-bold">Your Cart</h1>
                <div className="ml-auto text-sm text-gray-500">{isLocalMode ? 'Guest mode' : 'Saved to your account'}</div>
            </div>

            {/* Guest banner */}
            {isLocalMode && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-semibold">You're browsing as a guest.</p>
                            <p className="text-sm text-gray-600">Items are stored locally in your browser and won't sync until you login via Telegram.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button asChild size="sm">
                                <a href="https://t.me/CfigoBot" target="_blank" rel="noreferrer">Open in Telegram</a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { try { navigator.clipboard.writeText(window.location.href + '?guest=1'); toast('Open this link in Telegram to login') } catch { toast('Open in Telegram') } }}>Copy Login Link</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!allItems.length && (
                <div className="text-center py-20">
                    <div className="text-6xl">🛒</div>
                    <h3 className="text-xl font-semibold mt-4">Your cart is empty</h3>
                    <p className="text-sm text-gray-500 mt-2">Browse products and tap "Add to Cart" to build your order.</p>
                    <div className="mt-6">
                        <Link href="/" className="inline-block"><Button>Continue Shopping</Button></Link>
                    </div>
                </div>
            )}

            {/* Items list */}
            <div className="space-y-4">
                {allItems.map((item: any) => (
                    <Card key={item.productId || item.product_id}>
                        <CardContent className="p-4 flex gap-4 items-center">
                            <div className="relative h-20 w-20 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <Image src={(item.product?.photos?.[0]) || item.photos?.[0] || '/placeholder.svg'} alt={(item.product?.name) || item.name} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="font-semibold line-clamp-2">{(item.product?.name) || item.name}</h3>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <Badge variant="secondary">{(item.product?.category) || item.category}</Badge>
                                    <span className="text-xs text-gray-500">ID #{item.productId || item.product_id}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => {
                                            if (item._local) updateLocalQuantity(item.productId, Math.max(1, item.quantity - 1))
                                            else {
                                                // optimistic update
                                                setServerItems(prev => prev.map(s => s.product_id === item.product_id ? { ...s, quantity: Math.max(1, s.quantity - 1) } : s))
                                                fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ productId: item.product_id, quantity: Math.max(1, item.quantity - 1) }) })
                                                    .then(async (r) => {
                                                        if (!r.ok) {
                                                            // revert
                                                            setServerItems(prev => prev.map(s => s.product_id === item.product_id ? { ...s, quantity: item.quantity } : s))
                                                            toast.error('Failed to update quantity')
                                                        }
                                                    }).catch(() => {
                                                        setServerItems(prev => prev.map(s => s.product_id === item.product_id ? { ...s, quantity: item.quantity } : s))
                                                        toast.error('Failed to update quantity')
                                                    })
                                            }
                                        }}>-</Button>
                                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                                        <Button size="sm" variant="outline" onClick={() => {
                                            if (item._local) updateLocalQuantity(item.productId, item.quantity + 1)
                                            else {
                                                // optimistic add (increment)
                                                setServerItems(prev => prev.map(s => s.product_id === item.product_id ? { ...s, quantity: s.quantity + 1 } : s))
                                                fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ productId: item.product_id, quantity: 1 }) })
                                                    .then(async (r) => {
                                                        if (!r.ok) {
                                                            setServerItems(prev => prev.map(s => s.product_id === item.product_id ? { ...s, quantity: item.quantity } : s))
                                                            toast.error('Failed to add')
                                                        }
                                                    }).catch(() => {
                                                        setServerItems(prev => prev.map(s => s.product_id === item.product_id ? { ...s, quantity: item.quantity } : s))
                                                        toast.error('Failed to add')
                                                    })
                                            }
                                        }}>+</Button>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        if (item._local) removeLocalItem(item.productId)
                                        else {
                                            // optimistic remove
                                            const prev = serverItems
                                            setServerItems(prev => prev.filter(s => s.product_id !== item.product_id))
                                            fetch(`/api/cart?productId=${item.product_id}`, { method: 'DELETE', credentials: 'include' }).then(async (r) => {
                                                if (!r.ok) {
                                                    setServerItems(prev)
                                                    toast.error('Failed to remove')
                                                }
                                            }).catch(() => { setServerItems(prev); toast.error('Failed to remove') })
                                        }
                                    }}>Remove</Button>
                                </div>
                            </div>
                            <div className="text-right font-semibold text-sm">
                                <div>{Number(item.product?.price || item.price || 0).toFixed(2)}</div>
                                <div className="text-xs text-gray-500">{item.quantity} x</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Totals & actions */}
            {allItems.length > 0 && (
                <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-md border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Subtotal</div>
                            <div className="text-lg font-bold">{subtotal.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLocalMode ? (
                                <Button onClick={() => {
                                    // encourage login/merge
                                    toast('Open this app in Telegram to sync and checkout')
                                }}>Login to Sync</Button>
                            ) : (
                                <>
                                    <Button onClick={() => { router.push('/orders') }}>Checkout</Button>
                                    {/* Proceed to Order visible only for authenticated non-guest sessions */}
                                    {(isAuthenticated && !isGuest) && (
                                        <Button variant="secondary" onClick={() => { router.push('/orders') }}>Proceed to Order</Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
