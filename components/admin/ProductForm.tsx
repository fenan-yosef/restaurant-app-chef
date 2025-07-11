"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { telegramLogger } from "@/lib/telegram-logger"

interface ProductFormProps {
    product?: Product | null
    onSubmit: (success: boolean) => void
}

export default function ProductForm({ product, onSubmit }: ProductFormProps) {
    const { user: adminUser } = useAuth()
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        description: "",
        price: 0,
        category: "None",
        photos: [],
        videos: [],
        design: "None",
        flavor: "None",
        occasion: "None",
        size: "None",
        is_available: true,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                price: Number.parseFloat(product.price.toString()), // Ensure price is number for form input
            })
        } else {
            // Reset form for new product
            setFormData({
                name: "",
                description: "",
                price: 0,
                category: "None",
                photos: [],
                videos: [],
                design: "None",
                flavor: "None",
                occasion: "None",
                size: "None",
                is_available: true,
            })
        }
    }, [product])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        if (type === "number") {
            setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) }))
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_available: checked }))
    }

    const handleSelectChange = (name: keyof Product, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value === "None" ? "" : value }))
    }

    const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, photos: e.target.value ? [e.target.value] : [] }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (!adminUser?.id) {
            setError("Admin user not identified. Cannot submit.")
            setLoading(false)
            telegramLogger.error("Admin user ID missing for product form submission.", "ProductForm/handleSubmit")
            onSubmit(false)
            return
        }

        try {
            const method = product ? "PUT" : "POST"
            const url = "/api/admin/products"
            const payload = { ...formData, adminUserId: adminUser.id }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                telegramLogger.info(`${product ? "Updated" : "Added"} product: ${formData.name}`, "ProductForm/handleSubmit")
                onSubmit(true)
            } else {
                const errorData = await response.json()
                setError(errorData.error || `Failed to ${product ? "update" : "add"} product.`)
                telegramLogger.error(
                    `Failed to ${product ? "update" : "add"} product: ${errorData.error}`,
                    "ProductForm/handleSubmit",
                )
                onSubmit(false)
            }
        } catch (err: any) {
            setError(`An unexpected error occurred: ${err.message}`)
            telegramLogger.error(`Unexpected error in product form: ${err.message}`, "ProductForm/handleSubmit")
            onSubmit(false)
        } finally {
            setLoading(false)
        }
    }

    // Mock data for categories and attributes for the forms.
    // In a real app, these would also be fetched dynamically from your /api/filters or a dedicated endpoint.
    const categories = ["Bread", "Pastries", "Muffins", "Cakes", "Cookies", "Tarts", "Drinks", "Other"]
    const designs = ["Classic", "Modern", "Rustic", "Themed", "Custom"]
    const flavors = ["Chocolate", "Vanilla", "Strawberry", "Lemon", "Caramel", "Coffee", "Fruity", "Spicy"]
    const occasions = ["Birthday", "Wedding", "Anniversary", "Holiday", "Everyday", "Corporate"]
    const sizes = ["Small", "Medium", "Large", "Individual", "Family"]

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input type="text" id="name" name="name" value={formData.name || ""} onChange={handleChange} required />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    rows={3}
                />
            </div>

            <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price || 0}
                    onChange={handleChange}
                    required
                    step="0.01"
                />
            </div>

            <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category || "None"} onValueChange={(val) => handleSelectChange("category", val)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="photos">Image URL</Label>
                <Input
                    type="url"
                    id="photos"
                    name="photos"
                    value={formData.photos?.[0] || ""}
                    onChange={handlePhotoUrlChange}
                    placeholder="e.g., https://example.com/image.jpg"
                />
            </div>

            {/* Optional Attributes */}
            <div>
                <Label htmlFor="design">Design</Label>
                <Select value={formData.design || "None"} onValueChange={(val) => handleSelectChange("design", val)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a design style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {designs.map((d) => (
                            <SelectItem key={d} value={d}>
                                {d}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="flavor">Flavor</Label>
                <Select value={formData.flavor || "None"} onValueChange={(val) => handleSelectChange("flavor", val)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a flavor profile" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {flavors.map((f) => (
                            <SelectItem key={f} value={f}>
                                {f}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="occasion">Occasion</Label>
                <Select value={formData.occasion || "None"} onValueChange={(val) => handleSelectChange("occasion", val)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an occasion" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {occasions.map((o) => (
                            <SelectItem key={o} value={o}>
                                {o}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="size">Size</Label>
                <Select value={formData.size || "None"} onValueChange={(val) => handleSelectChange("size", val)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a size option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {sizes.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="is_available" checked={formData.is_available} onCheckedChange={handleCheckboxChange} />
                <Label htmlFor="is_available">Available for Sale</Label>
            </div>

            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? "Save Changes" : "Add Product"}
            </Button>
        </form>
    )
}
