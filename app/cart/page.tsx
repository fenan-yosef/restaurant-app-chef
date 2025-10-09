"use client"

import { useEffect, useMemo, useState } from "react"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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

    // Checkout form state
    const [phoneNumber, setPhoneNumber] = useState("")
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [notes, setNotes] = useState("")
    const [placingOrder, setPlacingOrder] = useState(false)

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

    const handlePlaceOrder = async () => {
        if (!isAuthenticated || isGuest || !user?.id) {
            toast.error('Please login via Telegram to place an order')
            return
        }

        if (!phoneNumber.trim() || !deliveryAddress.trim()) {
            toast.error('Phone number and delivery address are required')
            return
        }

        setPlacingOrder(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: user.id,
                    deliveryAddress,
                    phoneNumber,
                    notes,
                })
            })

            if (!res.ok) {
                let msg = 'Failed to place order'
                try {
                    const data = await res.json()
                    if (data?.error) msg = data.error
                } catch { }
                throw new Error(msg)
            }

            toast.success('Order placed successfully')
            router.push('/orders')
        } catch (err: any) {
            toast.error(err?.message || 'Failed to place order')
        } finally {
            setPlacingOrder(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Nav */}
            <div className="flex items-center gap-4 flex-wrap">
                <Link href="/" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></Link>
                <h1 className="text-xl sm:text-2xl font-bold">Your Cart</h1>
                <div className="ml-auto text-sm text-gray-500">{isLocalMode ? 'Guest mode' : 'Saved to your account'}</div>
            </div>

            {/* Guest banner */}
            {isLocalMode && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-semibold truncate">You're browsing as a guest.</p>
                            <p className="text-sm text-gray-600">Items are stored locally in your browser and won't sync until you login via Telegram.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <Button asChild size="sm" className="w-full sm:w-auto">
                                <a href="https://t.me/CfigoBot" target="_blank" rel="noreferrer">Open in Telegram</a>
                            </Button>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => { try { navigator.clipboard.writeText(window.location.href + '?guest=1'); toast('Open this link in Telegram to login') } catch { toast('Open in Telegram') } }}>Copy Login Link</Button>
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
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="relative h-20 w-20 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                <Image src={(item.product?.photos?.[0]) || item.photos?.[0] || '/placeholder.svg'} alt={(item.product?.name) || item.name} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <h3 className="font-semibold line-clamp-2 break-words">{(item.product?.name) || item.name}</h3>
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
                                        <span className="text-sm w-8 text-center">{item.quantity}</span>
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
                            <div className="text-right font-semibold text-sm w-full md:w-auto">
                                <div>{Number(item.product?.price || item.price || 0).toFixed(2)}</div>
                                <div className="text-xs text-gray-500">{item.quantity} x</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Totals & checkout form */}
            {allItems.length > 0 && (
                <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-md border space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Subtotal</div>
                            <div className="text-lg font-bold">{subtotal.toFixed(2)}</div>
                        </div>
                        {isLocalMode && (
                            <div className="flex items-center gap-2">
                                <Button onClick={() => {
                                    toast('Open this app in Telegram to sync and checkout')
                                }}>Login to Sync</Button>
                            </div>
                        )}
                    </div>

                    {!isLocalMode && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" inputMode="tel" placeholder="e.g. +251 9XX XXX XXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                                    <Textarea id="deliveryAddress" rows={3} placeholder="Street, building, landmark, etc." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Textarea id="notes" rows={2} placeholder="Any special requests?" value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handlePlaceOrder} disabled={placingOrder}>
                                    {placingOrder ? 'Placing...' : 'Place Order'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}
