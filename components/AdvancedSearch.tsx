"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X, SlidersHorizontal, ArrowUpDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdvancedSearchProps {
    filters: any
    onFiltersChange: (filters: any) => void
    availableFilters: {
        categories: string[]
        designs: string[]
        flavors: string[]
        occasions: string[]
        sizes: string[]
    }
    isSearching?: boolean
    resultsCount?: number
}

export default function AdvancedSearch({
    filters,
    onFiltersChange,
    availableFilters,
    isSearching = false,
    resultsCount = 0,
}: AdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showSortOptions, setShowSortOptions] = useState(false)

    const activeFiltersCount = Object.entries(filters).filter(
        ([key, value]) => value && value !== "" && value !== "all" && key !== "sortBy" && key !== "sortOrder",
    ).length

    const handleFilterChange = (key: string, value: any) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    const clearFilters = () => {
        onFiltersChange({
            query: "",
            sortBy: "created_at",
            sortOrder: "desc",
        })
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Main Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search
                        className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            isSearching ? "text-blue-500 animate-pulse" : "text-gray-400 group-focus-within:text-blue-500",
                        )}
                    />
                </div>
                <Input
                    placeholder="Search products, flavors, occasions..."
                    value={filters.query || ""}
                    onChange={(e) => handleFilterChange("query", e.target.value)}
                    className="pl-10 pr-12 h-12 text-lg border-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                />
                {filters.query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilterChange("query", "")}
                        className="absolute inset-y-0 right-0 px-3 hover:bg-transparent"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Quick Filters */}
            {availableFilters.categories.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 shadow-sm">
                    <Tabs
                        value={filters.category || "all"}
                        onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
                    >
                        <TabsList className="grid w-full grid-cols-auto overflow-x-auto bg-gray-100 dark:bg-gray-700">
                            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
                                All
                            </TabsTrigger>
                            {availableFilters.categories.slice(0, 5).map((category) => (
                                <TabsTrigger
                                    key={category}
                                    value={category}
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"
                                >
                                    {category}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {/* Advanced Filters & Sort */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="transition-all duration-200 hover:scale-105"
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {activeFiltersCount > 0 && (
                        <Badge className="ml-2 animate-bounce" variant="secondary">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSortOptions(!showSortOptions)}
                        className="transition-all duration-200 hover:scale-105"
                    >
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        Sort
                    </Button>

                    {resultsCount > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Sparkles className="h-4 w-4" />
                            <span>{resultsCount} results</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sort Options */}
            {showSortOptions && (
                <Card className="animate-slide-down">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Sort by</Label>
                                <Select
                                    value={filters.sortBy || "created_at"}
                                    onValueChange={(value) => handleFilterChange("sortBy", value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at">Date Added</SelectItem>
                                        <SelectItem value="name">Name</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Order</Label>
                                <Select
                                    value={filters.sortOrder || "desc"}
                                    onValueChange={(value) => handleFilterChange("sortOrder", value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asc">Ascending</SelectItem>
                                        <SelectItem value="desc">Descending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Advanced Filters Panel */}
            {isExpanded && (
                <Card className="animate-slide-down">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center">
                                <Filter className="h-5 w-5 mr-2" />
                                Advanced Filters
                            </CardTitle>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Design Filter */}
                        {availableFilters.designs.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center">🎨 Design Style</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={!filters.design ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("design", "")}
                                        className="transition-all duration-200 hover:scale-105"
                                    >
                                        All Designs
                                    </Button>
                                    {availableFilters.designs.map((design) => (
                                        <Button
                                            key={design}
                                            variant={filters.design === design ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("design", design)}
                                            className="transition-all duration-200 hover:scale-105"
                                        >
                                            {design}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flavor Filter */}
                        {availableFilters.flavors.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center">🍽️ Flavor Profile</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={!filters.flavor ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("flavor", "")}
                                        className="transition-all duration-200 hover:scale-105"
                                    >
                                        All Flavors
                                    </Button>
                                    {availableFilters.flavors.map((flavor) => (
                                        <Button
                                            key={flavor}
                                            variant={filters.flavor === flavor ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("flavor", flavor)}
                                            className="transition-all duration-200 hover:scale-105"
                                        >
                                            {flavor}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Occasion Filter */}
                        {availableFilters.occasions.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center">🎉 Perfect For</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={!filters.occasion ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("occasion", "")}
                                        className="transition-all duration-200 hover:scale-105"
                                    >
                                        Any Occasion
                                    </Button>
                                    {availableFilters.occasions.map((occasion) => (
                                        <Button
                                            key={occasion}
                                            variant={filters.occasion === occasion ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("occasion", occasion)}
                                            className="transition-all duration-200 hover:scale-105"
                                        >
                                            {occasion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Filter */}
                        {availableFilters.sizes.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center">📏 Size Options</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={!filters.size ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange("size", "")}
                                        className="transition-all duration-200 hover:scale-105"
                                    >
                                        All Sizes
                                    </Button>
                                    {availableFilters.sizes.map((size) => (
                                        <Button
                                            key={size}
                                            variant={filters.size === size ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleFilterChange("size", size)}
                                            className="transition-all duration-200 hover:scale-105"
                                        >
                                            {size}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
