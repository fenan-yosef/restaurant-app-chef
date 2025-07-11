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
            setFormData({
                ...product,
                photos: product.photos || [],
                videos: product.videos || [],
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

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, photos: e.target.value.split(",").map((s) => s.trim()) }))
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
            <div>
                <Label htmlFor="photos">Photos (comma-separated URLs)</Label>
                <Input id="photos" value={formData.photos?.join(", ") || ""} onChange={handlePhotoChange} />
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
