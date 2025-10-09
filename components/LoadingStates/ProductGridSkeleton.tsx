import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface ProductGridSkeletonProps {
    count?: number
}

export default function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-2 sm:p-4">
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} className="flex flex-col animate-pulse w-full max-w-full">
                    <CardHeader className="p-0">
                        <Skeleton className="w-full aspect-square rounded-t-lg" />
                    </CardHeader>
                    <CardContent className="p-4 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-8 w-1/3 rounded-md" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
