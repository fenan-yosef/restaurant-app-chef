import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden animate-fade-in">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-8 w-20" />
            </CardContent>
            <CardFooter className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-center space-x-2 w-full">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex space-x-2 w-full">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                </div>
            </CardFooter>
        </Card>
    )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function SearchResultsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>
            <ProductGridSkeleton count={4} />
        </div>
    )
}
