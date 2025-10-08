"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/lib/types"
import toast from "react-hot-toast"

const LOCAL_CART_KEY = "localCart:v1"

interface LocalCartItem {
    productId: number
    quantity: number
    product: Pick<Product, "id" | "name" | "price" | "photos" | "category"> & Partial<Product>
}

function readLocalCart(): LocalCartItem[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(LOCAL_CART_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
    } catch { /* ignore */ }
    return []
}

function writeLocalCart(items: LocalCartItem[]) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items)) } catch { }
}

export function useCart() {
    const { user, isAuthenticated, isGuest } = useAuth()
    const [localItems, setLocalItems] = useState<LocalCartItem[]>(() => readLocalCart())
    const mergingRef = useRef(false)

    // Persist local changes
    useEffect(() => { writeLocalCart(localItems) }, [localItems])

    // Merge local into server when authenticated (but NOT for explicit browser guest sessions)
    useEffect(() => {
        const merge = async () => {
            if (!isAuthenticated || !user?.id) return
            // If this session was explicitly marked as a browser guest, do not merge
            if (isGuest) return
            const pending = readLocalCart()
            if (!pending.length) return
            if (mergingRef.current) return
            mergingRef.current = true
            try {
                for (const item of pending) {
                    await fetch('/api/cart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ productId: item.productId, quantity: item.quantity })
                    })
                }
                // Clear local cart after merging
                setLocalItems([])
                writeLocalCart([])
                // Fetch authoritative server count
                try {
                    const res = await fetch(`/api/cart?userId=${user.id}`)
                    const data = res.ok ? await res.json() : []
                    const total = Array.isArray(data) ? data.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0) : 0
                    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: total } }))
                } catch { }
                toast.success('Cart synced to your account')
            } catch (e) {
                toast.error('Failed to sync cart')
            } finally {
                mergingRef.current = false
            }
        }
        merge()
    }, [isAuthenticated, user, isGuest])

    const addItem = async (product: Product, qty: number = 1) => {
        // Dispatch optimistic event
        window.dispatchEvent(new CustomEvent('cart-optimistic', { detail: { delta: qty } }))
        if (!isAuthenticated || !user?.id || isGuest) {
            // Local mode
            try {
                setLocalItems(prev => {
                    const next = [...prev]
                    const idx = next.findIndex(i => i.productId === product.id)
                    if (idx >= 0) next[idx].quantity += qty
                    else next.push({ productId: product.id, quantity: qty, product: { id: product.id, name: product.name, price: product.price, photos: product.photos, category: product.category } })
                    return next
                })
                const all = readLocalCart()
                const total = all.reduce((s, i) => s + i.quantity, 0)
                window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: total } }))
                toast.success('Added to cart')
                return true
            } catch (e) {
                window.dispatchEvent(new CustomEvent('cart-revert', { detail: { delta: qty } }))
                toast.error('Could not add (local)')
                return false
            }
        } else {
            // Server mode
            try {
                const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ productId: product.id, quantity: qty }) })
                if (!res.ok) throw new Error('Failed')
                // Refetch count
                try {
                    const cart = await fetch(`/api/cart?userId=${user.id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : [])
                    const total = Array.isArray(cart) ? cart.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0) : 0
                    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: total } }))
                } catch { }
                toast.success('Added to cart')
                return true
            } catch (e) {
                window.dispatchEvent(new CustomEvent('cart-revert', { detail: { delta: qty } }))
                toast.error('Could not add to cart')
                return false
            }
        }
    }

    const updateLocalQuantity = (productId: number, quantity: number) => {
        setLocalItems(prev => {
            const next = prev.map(i => i.productId === productId ? { ...i, quantity } : i).filter(i => i.quantity > 0)
            writeLocalCart(next)
            const total = next.reduce((s, i) => s + i.quantity, 0)
            window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: total } }))
            return next
        })
    }

    const removeLocalItem = (productId: number) => {
        setLocalItems(prev => {
            const next = prev.filter(i => i.productId !== productId)
            writeLocalCart(next)
            const total = next.reduce((s, i) => s + i.quantity, 0)
            window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: total } }))
            return next
        })
    }

    return {
        addItem,
        localItems,
        isLocalMode: !!(isGuest || !isAuthenticated || !user?.id),
        updateLocalQuantity,
        removeLocalItem,
        LOCAL_CART_KEY,
    }
}
