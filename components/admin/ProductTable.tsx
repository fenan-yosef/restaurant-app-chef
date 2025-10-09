"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import ProductForm from "@/components/admin/ProductForm"
import { Plus, Edit, Trash2, Box, DollarSign, Check, X as XIcon, RefreshCcw, ArrowUpDown } from "lucide-react"
import { formatCurrency, toNumber } from "@/lib/utils"
import { getImageUrl } from "@/lib/product-parser" // Corrected import path
import { telegramLogger } from "@/lib/telegram-logger"
import ProductGridSkeleton from "@/components/LoadingStates/ProductGridSkeleton" // Corrected import path

export default function ProductTable() {
    const { user: adminUser, isAuthenticated, isLoading: authLoading } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [showProductForm, setShowProductForm] = useState(false)
    const [priceEditingId, setPriceEditingId] = useState<number | null>(null)
    const [tempPrice, setTempPrice] = useState<string>("")
    const [sortBy, setSortBy] = useState<
        "updated_at" | "created_at" | "id" | "name" | "price" | "category" | "is_available"
    >("updated_at")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const fetchProducts = async () => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing, cannot fetch products.", "ProductTable/fetchProducts")
            return
        }
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                adminUserId: String(adminUser.id),
                sortBy,
                sortOrder,
            })
            const response = await fetch(`/api/admin/products?${params.toString()}`)
            if (response.ok) {
                const data: Product[] = await response.json()
                setProducts(data)
                telegramLogger.info(`Fetched ${data.length} admin products.`, "ProductTable/fetchProducts")
            } else {
                const errorData = await response.json()
                telegramLogger.error(`Failed to fetch admin products: ${errorData.error}`, "ProductTable/fetchProducts")
            }
        } catch (error: any) {
            telegramLogger.error(`Error fetching admin products: ${error.message}`, "ProductTable/fetchProducts")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && isAuthenticated && adminUser) {
            fetchProducts()
        }
    }, [authLoading, isAuthenticated, adminUser, sortBy, sortOrder])

    const toggleSort = (column: typeof sortBy) => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortBy(column)
            setSortOrder("asc")
        }
    }

    const handleEditPrice = (product: Product) => {
        setPriceEditingId(product.id)
        setTempPrice(toNumber(product.price).toFixed(2))
    }

    const handleSavePrice = async (productId: number) => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing for price update.", "ProductTable/handleSavePrice")
            return
        }
        setIsLoading(true) // Indicate loading for the update
        const productToUpdate = products.find((p) => p.id === productId)
        if (!productToUpdate) return

        try {
            const updatedProduct = {
                ...productToUpdate,
                price: toNumber(tempPrice),
                adminUserId: adminUser.id, // Ensure adminUserId is sent
            }
            const response = await fetch("/api/admin/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedProduct),
            })

            if (response.ok) {
                telegramLogger.info(`Product ${productId} price updated to ${tempPrice}.`, "ProductTable/handleSavePrice")
                await fetchProducts() // Refresh the list
            } else {
                const errorData = await response.json()
                telegramLogger.error(
                    `Failed to update product ${productId} price: ${errorData.error}`,
                    "ProductTable/handleSavePrice",
                )
                alert(`Failed to update price: ${errorData.error}`)
            }
        } catch (error: any) {
            telegramLogger.error(`Error updating product price: ${error.message}`, "ProductTable/handleSavePrice")
            alert(`Error updating price: ${error.message}`)
        } finally {
            setPriceEditingId(null)
            setTempPrice("")
            setIsLoading(false)
        }
    }

    const handleDeleteProduct = async (productId: number) => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing for product deletion.", "ProductTable/handleDeleteProduct")
            return
        }
        if (!confirm("Are you sure you want to delete this product?")) {
            return
        }
        setIsLoading(true) // Indicate loading for deletion
        try {
            const response = await fetch("/api/admin/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, adminUserId: adminUser.id }), // Ensure adminUserId is sent
            })

            if (response.ok) {
                telegramLogger.info(`Product ${productId} deleted.`, "ProductTable/handleDeleteProduct")
                await fetchProducts() // Refresh the list
            } else {
                const errorData = await response.json()
                telegramLogger.error(
                    `Failed to delete product ${productId}: ${errorData.error}`,
                    "ProductTable/handleDeleteProduct",
                )
                alert(`Failed to delete product: ${errorData.error}`)
            }
        } catch (error: any) {
            telegramLogger.error(`Error deleting product: ${error.message}`, "ProductTable/handleDeleteProduct")
            alert(`Error deleting product: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleProductFormSubmit = async (success: boolean) => {
        if (success) {
            await fetchProducts()
        }
        setEditingProduct(null)
        setShowProductForm(false)
    }

    if (isLoading) {
        return <ProductGridSkeleton count={3} />
    }

    return (
        <Card className="shadow-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
            <CardHeader className="pb-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Box className="h-5 w-5" /> Products
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Manage your bakery's product catalog.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 dark:text-slate-400">Sort by</label>
                            <select
                                className="h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs px-2"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            >
                                <option value="updated_at">Updated</option>
                                <option value="created_at">Created</option>
                                <option value="id">ID</option>
                                <option value="name">Name</option>
                                <option value="price">Price</option>
                                <option value="category">Category</option>
                            </select>
                            <select
                                className="h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs px-2"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                            >
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={fetchProducts}
                            disabled={isLoading}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" /> New
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px] overflow-y-auto max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                                    <DialogDescription>
                                        {editingProduct
                                            ? "Update this product's details."
                                            : "Add a new delicious item to your menu."}
                                    </DialogDescription>
                                </DialogHeader>
                                <ProductForm product={editingProduct} onSubmit={handleProductFormSubmit} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No products found.</div>
                ) : (
                    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                        <Table className="min-w-full text-sm">
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                                    <TableHead className="w-[84px] text-slate-600 dark:text-slate-300">Thumb</TableHead>
                                    <TableHead
                                        onClick={() => toggleSort("name")}
                                        className="min-w-[220px] text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                                        title="Sort by name"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            Name & Meta
                                            {sortBy === "name" && (
                                                <ArrowUpDown className={`h-3 w-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        onClick={() => toggleSort("category")}
                                        className="w-[140px] text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                                        title="Sort by category"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            Category
                                            {sortBy === "category" && (
                                                <ArrowUpDown className={`h-3 w-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        onClick={() => toggleSort("price")}
                                        className="w-[120px] text-slate-600 dark:text-slate-300 text-right cursor-pointer select-none"
                                        title="Sort by price"
                                    >
                                        <div className="inline-flex items-center gap-1 justify-end w-full">
                                            <span>Price</span>
                                            {sortBy === "price" && (
                                                <ArrowUpDown className={`h-3 w-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        onClick={() => toggleSort("is_available")}
                                        className="w-[120px] text-slate-600 dark:text-slate-300 text-center cursor-pointer select-none"
                                        title="Sort by availability"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            Status
                                            {sortBy === "is_available" && (
                                                <ArrowUpDown className={`h-3 w-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[140px] text-center text-slate-600 dark:text-slate-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => {
                                    const thumb = getImageUrl(product.photos) || "/placeholder.svg"
                                    const meta: string[] = []
                                    if (product.design) meta.push(product.design)
                                    if (product.flavor) meta.push(product.flavor)
                                    if (product.size) meta.push(product.size)
                                    if (product.occasion) meta.push(product.occasion)
                                    return (
                                        <TableRow
                                            key={product.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="relative h-14 w-14 overflow-hidden rounded-md ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800">
                                                    <div className="w-full h-full relative">
                                                        <Image
                                                            src={thumb}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="56px"
                                                            loading="lazy"
                                                        />
                                                        {/* Thumbnail badge overlay */}
                                                        <span className="absolute left-1 top-1 text-[10px] px-2 py-0.5 rounded bg-white/80 text-slate-800 dark:bg-black/60 dark:text-white shadow-sm">
                                                            Thumb
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <div className="font-medium truncate max-w-[240px]">{product.name}</div>
                                                {meta.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {meta.slice(0, 3).map((m) => (
                                                            <span
                                                                key={m}
                                                                className="rounded-full bg-blue-100 text-blue-700 dark:bg-indigo-600/30 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-medium tracking-wide"
                                                            >
                                                                {m}
                                                            </span>
                                                        ))}
                                                        {meta.length > 3 && (
                                                            <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">+{meta.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    ID: {product.id}
                                                </p>
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700/60 px-2 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-600">
                                                    {product.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-right">
                                                {priceEditingId === product.id ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Input
                                                            type="number"
                                                            value={tempPrice}
                                                            autoFocus
                                                            onChange={(e) => setTempPrice(e.target.value)}
                                                            className="w-24 h-8 text-right text-xs"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleSavePrice(product.id)
                                                                if (e.key === "Escape") {
                                                                    setPriceEditingId(null)
                                                                    setTempPrice("")
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-8 w-8"
                                                            onClick={() => handleSavePrice(product.id)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                setPriceEditingId(null)
                                                                setTempPrice("")
                                                            }}
                                                        >
                                                            <XIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditPrice(product)}
                                                        className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-indigo-400 font-medium"
                                                    >
                                                        <span>{formatCurrency(product.price)}</span>
                                                        <Edit className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                                                    </button>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-center">
                                                {product.is_available ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-300 px-2 py-0.5 text-[10px] font-semibold">
                                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300 px-2 py-0.5 text-[10px] font-semibold">
                                                        <span className="h-2 w-2 rounded-full bg-red-500" />
                                                        Hidden
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setEditingProduct(product)
                                                            setShowProductForm(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
