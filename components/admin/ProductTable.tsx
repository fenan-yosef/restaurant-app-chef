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
import { Plus, Edit, Trash2, Box, DollarSign } from "lucide-react"
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

    const fetchProducts = async () => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing, cannot fetch products.", "ProductTable/fetchProducts")
            return
        }
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/products?adminUserId=${adminUser.id}`)
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
    }, [authLoading, isAuthenticated, adminUser])

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
                adminUserId: adminUser.id,
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
                body: JSON.stringify({ productId, adminUserId: adminUser.id }),
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
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                    <Box className="h-5 w-5 mr-2" /> All Products
                </CardTitle>
                <CardDescription>Manage your bakery's product catalog.</CardDescription>
                <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
                    <DialogTrigger asChild>
                        <Button className="mt-4 self-end">
                            <Plus className="h-4 w-4 mr-2" /> Add New Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                            <DialogDescription>
                                {editingProduct ? "Make changes to the product here." : "Add a new delicious item to your menu."}
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm product={editingProduct} onSubmit={handleProductFormSubmit} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No products found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead className="w-[200px]">Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="w-[120px]">Price</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <TableCell>
                                            <Image
                                                src={getImageUrl(product.photos) || "/placeholder.svg"}
                                                alt={product.name}
                                                width={60}
                                                height={60}
                                                className="rounded object-cover"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>
                                            {priceEditingId === product.id ? (
                                                <div className="flex items-center space-x-1">
                                                    <Input
                                                        type="number"
                                                        value={tempPrice}
                                                        onChange={(e) => setTempPrice(e.target.value)}
                                                        onBlur={() => handleSavePrice(product.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleSavePrice(product.id)
                                                            }
                                                        }}
                                                        className="w-24 text-right"
                                                    />
                                                    <DollarSign className="h-4 w-4 text-gray-500" />
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex items-center space-x-1 cursor-pointer hover:text-blue-500"
                                                    onClick={() => handleEditPrice(product)}
                                                >
                                                    <span>{formatCurrency(product.price)}</span>
                                                    <Edit className="h-3 w-3" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{product.is_available ? "Yes" : "No"}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mr-2 bg-transparent"
                                                onClick={() => {
                                                    setEditingProduct(product)
                                                    setShowProductForm(true)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
