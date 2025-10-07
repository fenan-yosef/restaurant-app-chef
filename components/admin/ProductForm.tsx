"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { telegramLogger } from "@/lib/telegram-logger"

interface ProductFormProps {
    product?: Product | null
    onSubmit: (success: boolean) => void
}

export default function ProductForm({ product, onSubmit }: ProductFormProps) {
    const { user: adminUser, isAuthenticated, isLoading: authLoading } = useAuth()
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        description: "",
        price: 0,
        category: "",
        photos: [],
        videos: [],
        design: "",
        flavor: "",
        occasion: "",
        size: "",
        is_available: true,
        stock: 0,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (product) {
            let normalizedPhotos: any = product.photos
            if (typeof normalizedPhotos === 'string') {
                try { normalizedPhotos = JSON.parse(normalizedPhotos) } catch { normalizedPhotos = [normalizedPhotos] }
            }
            if (!Array.isArray(normalizedPhotos)) normalizedPhotos = []
            let normalizedVideos: any = product.videos
            if (typeof normalizedVideos === 'string') {
                try { normalizedVideos = JSON.parse(normalizedVideos) } catch { normalizedVideos = [normalizedVideos] }
            }
            if (!Array.isArray(normalizedVideos)) normalizedVideos = []
            setFormData({
                ...product,
                photos: normalizedPhotos,
                videos: normalizedVideos,
            })
        } else {
            setFormData({
                name: "",
                description: "",
                price: 0,
                category: "",
                photos: [],
                videos: [],
                design: "",
                flavor: "",
                occasion: "",
                size: "",
                is_available: true,
                stock: 0,
            })
        }
    }, [product])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target
        if (type === "number") {
            setFormData((prev) => ({ ...prev, [id]: Number.parseFloat(value) || 0 }))
        } else {
            setFormData((prev) => ({ ...prev, [id]: value }))
        }
    }

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_available: checked }))
    }

    // Multi-image upload state helpers
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        setUploadError(null)
        const accepted: string[] = []
        for (const file of Array.from(files)) {
            if (file.size > 15 * 1024 * 1024) {
                setUploadError(`File ${file.name} exceeds 15MB limit and was skipped.`)
                continue
            }
            try {
                setUploading(true)
                const fd = new FormData()
                fd.append('file', file)
                const res = await fetch('/api/upload', { method: 'POST', body: fd })
                const data = await res.json()
                if (res.ok && data.success && data.url) {
                    accepted.push(data.url)
                } else {
                    setUploadError(data.error || 'Upload failed')
                }
            } catch (err: any) {
                setUploadError(err?.message || 'Upload error')
            } finally {
                setUploading(false)
            }
        }
        if (accepted.length) {
            setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), ...accepted] }))
        }
        // Reset the file input so selecting same file again works
        e.target.value = ''
    }

    const handleRemovePhoto = (index: number) => {
        setFormData(prev => ({ ...prev, photos: (prev.photos || []).filter((_, i) => i !== index) }))
    }

    const handleReorder = (from: number, to: number) => {
        if (from === to) return
        setFormData(prev => {
            const arr = [...(prev.photos || [])]
            const [moved] = arr.splice(from, 1)
            arr.splice(to, 0, moved)
            return { ...prev, photos: arr }
        })
    }

    const handleSetThumbnail = (index: number) => {
        setFormData(prev => {
            const arr = [...(prev.photos || [])]
            if (index < 0 || index >= arr.length) return prev
            const [moved] = arr.splice(index, 1)
            arr.unshift(moved)
            return { ...prev, photos: arr }
        })
    }

    // Drag-and-drop handlers
    const [dragIndex, setDragIndex] = useState<number | null>(null)

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index)
        e.dataTransfer.setData('text/plain', String(index))
        e.dataTransfer.effectAllowed = 'move'
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const onDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault()
        const src = e.dataTransfer.getData('text/plain')
        const from = src ? Number(src) : dragIndex
        if (from === null || from === undefined) return
        if (from === dropIndex) return
        // Move item
        setFormData(prev => {
            const arr = [...(prev.photos || [])]
            const [moved] = arr.splice(from!, 1)
            arr.splice(dropIndex, 0, moved)
            return { ...prev, photos: arr }
        })
        setDragIndex(null)
    }

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, videos: e.target.value.split(",").map((s) => s.trim()) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!adminUser?.id) {
            setError("Admin user not authenticated.")
            telegramLogger.error("ProductForm: Admin user ID missing during form submission.", "ProductForm/handleSubmit")
            onSubmit(false)
            return
        }

        setIsSubmitting(true)
        setError(null)

        const payload = {
            ...formData,
            adminUserId: adminUser.id, // Ensure adminUserId is sent
            id: product?.id, // Include ID for updates
        }

        try {
            const response = await fetch("/api/admin/products", {
                method: product?.id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                telegramLogger.info(`Product ${product?.id ? "updated" : "added"} successfully.`, "ProductForm/handleSubmit")
                onSubmit(true)
            } else {
                const errorData = await response.json()
                setError(errorData.error || "Failed to save product.")
                telegramLogger.error(
                    `Failed to save product: ${errorData.error || response.statusText}`,
                    "ProductForm/handleSubmit",
                )
                onSubmit(false)
            }
        } catch (err: any) {
            setError("An unexpected error occurred.")
            telegramLogger.error(`Error saving product: ${err.message}`, "ProductForm/handleSubmit")
            onSubmit(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (authLoading) {
        return <div className="text-center py-4">Loading authentication...</div>
    }

    if (!isAuthenticated || !adminUser) {
        return <div className="text-center py-4 text-red-500">You are not authorized to access this form.</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={formData.name || ""} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description || ""} onChange={handleChange} rows={3} />
            </div>
            <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" value={formData.price || 0} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" step="1" value={formData.stock || 0} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={formData.category || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label>Photos</Label>
                <div className="flex flex-col gap-2">
                    <Input
                        id="photoFiles"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                    {uploading && <p className="text-xs text-blue-500">Uploading...</p>}
                    {formData.photos && formData.photos.length > 0 && (
                        <ul className="space-y-2 max-h-60 overflow-y-auto border rounded p-2 bg-muted/30">
                            {formData.photos.map((url, idx) => (
                                <li
                                    key={url + idx}
                                    className={`flex items-center gap-2 group ${dragIndex === idx ? 'opacity-60' : ''}`}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, idx)}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, idx)}
                                >
                                    <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded border bg-background">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={url}
                                            alt={`Photo ${idx + 1}`}
                                            className="object-cover w-full h-full"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs break-all select-text">{url}</span>
                                            {idx === 0 ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 text-green-800">Thumbnail</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            disabled={idx === 0}
                                            onClick={() => handleReorder(idx, idx - 1)}
                                            className="px-2"
                                        >↑</Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            disabled={idx === (formData.photos?.length || 0) - 1}
                                            onClick={() => handleReorder(idx, idx + 1)}
                                            className="px-2"
                                        >↓</Button>
                                        {idx !== 0 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSetThumbnail(idx)}
                                                className="px-2"
                                            >
                                                Set as thumbnail
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRemovePhoto(idx)}
                                            className="px-2"
                                        >✕</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Max per file 15MB. First image becomes primary.</p>
                </div>
            </div>
            <div>
                <Label htmlFor="videos">Videos (comma-separated URLs)</Label>
                <Input id="videos" value={formData.videos?.join(", ") || ""} onChange={handleVideoChange} />
            </div>
            <div>
                <Label htmlFor="design">Design</Label>
                <Input id="design" value={formData.design || ""} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="flavor">Flavor</Label>
                <Input id="flavor" value={formData.flavor || ""} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="occasion">Occasion</Label>
                <Input id="occasion" value={formData.occasion || ""} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="size">Size</Label>
                <Input id="size" value={formData.size || ""} onChange={handleChange} />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="is_available" checked={formData.is_available} onCheckedChange={handleCheckboxChange} />
                <Label htmlFor="is_available">Is Available</Label>
            </div>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
        </form>
    )
}
