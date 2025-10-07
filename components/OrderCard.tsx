import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/lib/types"
import { formatCurrency, toNumber } from "@/lib/utils"

interface OrderCardProps {
    order: Order
}

const statusColors = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    preparing: "bg-orange-500",
    ready: "bg-green-500",
    delivered: "bg-gray-500",
    cancelled: "bg-red-500",
}

export default function OrderCard({ order }: OrderCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Convert total_amount to number for calculations
    const totalAmount = toNumber(order.total_amount)

    return (
        <Card className="border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold tracking-tight">Order #{order.id}</CardTitle>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge className={`${statusColors[order.status]} shadow-sm px-3 py-1 rounded-full text-xs font-semibold tracking-wide`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-3">
                    {order.items?.map((item) => {
                        const imageUrl =
                            item.product.photos && item.product.photos.length > 0
                                ? item.product.photos[0]
                                : `/placeholder.svg?height=40&width=40`

                        // Convert item price to number for calculations
                        const itemPrice = toNumber(item.price)
                        const itemTotal = itemPrice * item.quantity

                        return (
                            <div key={item.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200/70 dark:ring-slate-700/60">
                                    <Image
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{item.product.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {item.quantity} × {formatCurrency(itemPrice)}
                                    </p>
                                </div>
                                <p className="font-semibold text-sm tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(itemTotal)}</p>
                            </div>
                        )
                    })}

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Total</span>
                            <span className="font-bold text-base text-green-600 dark:text-green-400 tracking-tight tabular-nums">{formatCurrency(totalAmount)}</span>
                        </div>

                        {order.delivery_address && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Delivery:</span> {order.delivery_address}
                            </p>
                        )}

                        {order.phone_number && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Phone:</span> {order.phone_number}
                            </p>
                        )}

                        {order.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Notes:</span> {order.notes}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
