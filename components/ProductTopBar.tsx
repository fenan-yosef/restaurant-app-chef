"use client"

import { useEffect, useState } from "react"
import { Toaster } from "react-hot-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface Props {
    title?: string
}

export default function ProductTopBar({ title }: Props) {
    const router = useRouter()
    const { user } = useAuth()
    const [count, setCount] = useState<number>(0)

    useEffect(() => {
        let mounted = true
        const onCartUpdated = (e: any) => {
            if (e?.detail?.count != null) setCount(Number(e.detail.count))
        }
        const onCartOptimistic = (e: any) => {
            if (e?.detail?.delta != null) setCount((c) => c + Number(e.detail.delta))
        }
        const onCartRevert = (e: any) => {
            if (e?.detail?.delta != null) setCount((c) => Math.max(0, c - Number(e.detail.delta)))
        }
        window.addEventListener('cart-updated', onCartUpdated)
        window.addEventListener('cart-optimistic', onCartOptimistic)
        window.addEventListener('cart-revert', onCartRevert)

        const fetchCart = async () => {
            // Use authenticated user id or persisted guest id
            let effectiveUserId: number | null = null
            if (user?.id) effectiveUserId = Number(user.id)
            if (!effectiveUserId && typeof window !== 'undefined') {
                const stored = localStorage.getItem('guestUserId')
                if (stored) effectiveUserId = Number(stored)
            }
            if (!effectiveUserId || Number(effectiveUserId) <= 0) return
            try {
                const res = await fetch(`/api/cart?userId=${effectiveUserId}`)
                if (!res.ok) return
                const data = await res.json()
                if (!mounted) return
                if (Array.isArray(data)) {
                    const qty = data.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
                    setCount(qty)
                } else {
                    setCount(0)
                }
            } catch (e) {
                // ignore
            }
        }
        fetchCart()
        return () => { mounted = false; window.removeEventListener('cart-updated', onCartUpdated); window.removeEventListener('cart-optimistic', onCartOptimistic); window.removeEventListener('cart-revert', onCartRevert) }
    }, [user])

    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60 mb-4">
            <button onClick={() => router.back()} aria-label="Go back" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex-1 text-center">
                <h2 className="text-lg font-semibold truncate">{title || 'Product Details'}</h2>
            </div>

            <Link id="cart-icon" href="/cart" className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full font-semibold">
                        {count}
                    </span>
                )}
            </Link>
            <Toaster position="top-right" />
        </div>
    )
}
