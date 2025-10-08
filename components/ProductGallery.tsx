"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
    photos: string[]
    alt?: string
    intervalMs?: number
}

export default function ProductGallery({ photos, alt = "Product image", intervalMs = 5000 }: Props) {
    const [current, setCurrent] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const timeoutRef = useRef<number | null>(null)

    useEffect(() => {
        // autoplay behavior
        if (isPaused || photos.length <= 1) return
        const id = window.setInterval(() => {
            setCurrent((c) => (c + 1) % photos.length)
        }, intervalMs)
        return () => clearInterval(id)
    }, [isPaused, photos.length, intervalMs])

    // clear any pending timers on unmount
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

    const goTo = (i: number) => {
        setCurrent(i % photos.length)
        // temporarily pause autoplay for a short time after manual interaction
        setIsPaused(true)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => setIsPaused(false), 6000)
    }

    const prev = () => { goTo((current - 1 + photos.length) % photos.length) }
    const next = () => { goTo((current + 1) % photos.length) }

    return (
        <div className="space-y-3">
            <div
                className="relative rounded-lg overflow-hidden shadow-lg"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                ref={containerRef}
            >
                <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
                        {photos.map((src, idx) => (
                            <div key={idx} className="relative flex-shrink-0 w-full h-full">
                                <Image src={src || "/placeholder.svg"} alt={`${alt} ${idx + 1}`} fill className="object-cover" sizes="100vw" unoptimized />
                            </div>
                        ))}
                    </div>

                    {photos.length > 1 && (
                        <>
                            <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/70 shadow-md hover:scale-105 transition-transform">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <button aria-label="Next" onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/70 shadow-md hover:scale-105 transition-transform">
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {photos.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {photos.slice(0, 5).map((p, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); goTo(i) }}
                            className={cn(
                                "relative h-20 rounded overflow-hidden border focus:outline-none",
                                i === current ? "ring-2 ring-blue-500" : ""
                            )}
                            aria-label={`View image ${i + 1}`}
                        >
                            <Image src={p} alt={`${alt} ${i + 1}`} fill className="object-cover" unoptimized />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
