"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useTelegram } from "@/hooks/useTelegram"
import { useCart } from "@/hooks/useCart"

interface Props { product: Product }

export default function ProductActions({ product }: Props) {
    const { hapticFeedback } = useTelegram()
    const { addItem } = useCart()
    const [loading, setLoading] = useState(false)

    const addToCart = async (qty = 1) => {
        setLoading(true)
        // Fly animation (optimistic event handled inside useCart.addItem)
        try {
            try {
                const imgSrc = (product.photos && product.photos[0]) || '/placeholder.svg'
                const startX = window.innerWidth / 2 - 32
                const startY = window.innerHeight / 3 - 32
                const fly = document.createElement('img')
                fly.src = imgSrc
                fly.style.position = 'fixed'
                fly.style.zIndex = '9999'
                fly.style.width = '64px'
                fly.style.height = '64px'
                fly.style.borderRadius = '8px'
                fly.style.left = `${startX}px`
                fly.style.top = `${startY}px`
                fly.style.pointerEvents = 'none'
                document.body.appendChild(fly)
                const cartEl = document.getElementById('cart-icon')
                if (cartEl) {
                    const cartRect = cartEl.getBoundingClientRect()
                    const deltaX = cartRect.left + cartRect.width / 2 - (startX + 32)
                    const deltaY = cartRect.top + cartRect.height / 2 - (startY + 32)
                    fly.animate([
                        { transform: 'translate(0,0) scale(1)', opacity: 1 },
                        { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0.2 }
                    ], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' })
                } else {
                    fly.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.2)', opacity: 0.2 }], { duration: 700 })
                }
                setTimeout(() => { try { fly.remove() } catch { } }, 800)
            } catch { }
            hapticFeedback('light')
            await addItem(product, qty)
        } finally {
            setLoading(false)
        }
    }

    const placeOrder = async () => {
        setLoading(true)
        try {
            // For now just add to cart and navigate to /orders (client can refine)
            await addToCart(1)
            hapticFeedback('medium')
            window.location.href = '/orders'
        } catch (e) {
        } finally { setLoading(false) }
    }

    const share = async () => {
        const url = `${window.location.origin}/products/${product.id}`
        try {
            if (navigator.share) {
                await navigator.share({ title: product.name, text: product.description, url })
            } else {
                await navigator.clipboard.writeText(url)
                try { alert('Link copied to clipboard') } catch { }
            }
        } catch (e) {
            try { alert('Share failed') } catch { }
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Button onClick={() => addToCart(1)} disabled={loading} className="flex-1">Add to Cart</Button>
                <Button onClick={placeOrder} disabled={loading} className="flex-1">Order Now</Button>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={share} className="flex-1">Share</Button>
                <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/products/${product.id}`); try { alert('Copied') } catch { } }} className="flex-1">Copy Link</Button>
            </div>
        </div>
    )
}
