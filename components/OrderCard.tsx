import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/lib/types"

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

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-3">
                    {order.items?.map((item) => {
                        const imageUrl =
                            item.product.photos && item.product.photos.length > 0
                                ? item.product.photos[0]
                                : `/placeholder.svg?height=40&width=40`

                        return (
                            <div key={item.id} className="flex items-center space-x-3">
                                <div className="relative h-10 w-10 flex-shrink-0">
                                    <Image
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover rounded"
                                        sizes="40px"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.product.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {item.quantity}x ${item.price.toFixed(2)}
                                    </p>
                                </div>
                                <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                            </div>
                        )
                    })}

                    <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Total:</span>
                            <span className="font-bold text-lg text-green-600">${order.total_amount.toFixed(2)}</span>
                        </div>

                        {order.delivery_address && (
                            <p className="text-sm text-gray-600 mt-2">
                                <strong>Delivery:</strong> {order.delivery_address}
                            </p>
                        )}

                        {order.phone_number && (
                            <p className="text-sm text-gray-600">
                                <strong>Phone:</strong> {order.phone_number}
                            </p>
                        )}

                        {order.notes && (
                            <p className="text-sm text-gray-600">
                                <strong>Notes:</strong> {order.notes}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
