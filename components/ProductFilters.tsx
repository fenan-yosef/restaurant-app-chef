"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Filter } from "lucide-react"
import type { ProductFilters } from "@/lib/types"

interface ProductFiltersProps {
    filters: ProductFilters
    onFiltersChange: (filters: ProductFilters) => void
    availableFilters: {
        categories: string[]
        designs: string[]
        flavors: string[]
        occasions: string[]
        sizes: string[]
        priceRange: { min: number; max: number }
    }
}

export default function ProductFilterComponent({ filters, onFiltersChange, availableFilters }: ProductFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [localFilters, setLocalFilters] = useState<ProductFilters>(filters)

    useEffect(() => {
        setLocalFilters(filters)
    }, [filters])

    const handleFilterChange = (key: keyof ProductFilters, value: any) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const clearFilters = () => {
        const emptyFilters: ProductFilters = {}
        setLocalFilters(emptyFilters)
        onFiltersChange(emptyFilters)
    }

    const activeFiltersCount = Object.values(localFilters).filter(
        (value) => value !== undefined && value !== "" && value !== "all",
    ).length

    return (
        <div className="space-y-4">
            {/* Quick Category Tabs */}
            <div className="bg-white border-b">
                <div className="px-4 py-3">
                    <Tabs value={localFilters.category || "all"} onValueChange={(value) => handleFilterChange("category", value)}>
                        <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
                            <TabsTrigger value="all">All</TabsTrigger>
                            {availableFilters.categories.slice(0, 4).map((category) => (
                                <TabsTrigger key={category} value={category}>
                                    {category}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="px-4">
                <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)} className="w-full justify-between">
                    <span className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Advanced Filters
                        {activeFiltersCount > 0 && (
                            <Badge className="ml-2" variant="secondary">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </span>
                </Button>
            </div>

            {/* Advanced Filters */}
            {isExpanded && (
                <Card className="mx-4">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Filter Products</CardTitle>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Design Filter */}
                        {availableFilters.designs.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium">🎨 Design</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                        variant={!localFilters.design || localFilters.design === "all" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("design", "all")}
                                    >
                                        All
                                    </Button>
                                    {availableFilters.designs.map((design) => (
                                        <Button
                                            key={design}
                                            variant={localFilters.design === design ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("design", design)}
                                        >
                                            {design}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flavor Filter */}
                        {availableFilters.flavors.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium">🍽️ Flavor</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                        variant={!localFilters.flavor || localFilters.flavor === "all" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("flavor", "all")}
                                    >
                                        All
                                    </Button>
                                    {availableFilters.flavors.map((flavor) => (
                                        <Button
                                            key={flavor}
                                            variant={localFilters.flavor === flavor ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("flavor", flavor)}
                                        >
                                            {flavor}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Occasion Filter */}
                        {availableFilters.occasions.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium">🎉 Occasion</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                        variant={!localFilters.occasion || localFilters.occasion === "all" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("occasion", "all")}
                                    >
                                        All
                                    </Button>
                                    {availableFilters.occasions.map((occasion) => (
                                        <Button
                                            key={occasion}
                                            variant={localFilters.occasion === occasion ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("occasion", occasion)}
                                        >
                                            {occasion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Filter */}
                        {availableFilters.sizes.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium">📏 Size</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                        variant={!localFilters.size || localFilters.size === "all" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("size", "all")}
                                    >
                                        All
                                    </Button>
                                    {availableFilters.sizes.map((size) => (
                                        <Button
                                            key={size}
                                            variant={localFilters.size === size ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("size", size)}
                                        >
                                            {size}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Range */}
                        <div>
                            <Label className="text-sm font-medium">💰 Price Range</Label>
                            <div className="flex space-x-2 mt-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={localFilters.priceRange?.min || ""}
                                    onChange={(e) =>
                                        handleFilterChange("priceRange", {
                                            ...localFilters.priceRange,
                                            min: Number.parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={localFilters.priceRange?.max || ""}
                                    onChange={(e) =>
                                        handleFilterChange("priceRange", {
                                            ...localFilters.priceRange,
                                            max: Number.parseFloat(e.target.value) || 1000,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
