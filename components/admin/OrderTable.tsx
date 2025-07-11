"use client"

import { useState, useEffect } from "react"
import type { Order } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, toNumber } from "@/lib/utils"
import { ArrowUpDown, Search, User, Package, ListFilter, RotateCcw } from "lucide-react"
import { telegramLogger } from "@/lib/telegram-logger"
import { cn } from "@/lib/utils"
import ProductGridSkeleton from "@/components/LoadingStates/ProductGridSkeleton" // Corrected import path

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"

const statusOptions: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]

interface OrderWithUserDetails extends Order {
    user_first_name?: string
    user_username?: string
}

export default function OrderTable() {
    const { user: adminUser, isAuthenticated, isLoading: authLoading } = useAuth()
    const [orders, setOrders] = useState<OrderWithUserDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: "asc" | "desc" }>({
        key: "created_at",
        direction: "desc",
    })

    const fetchOrders = async () => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing, cannot fetch orders.", "OrderTable/fetchOrders")
            return
        }
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("adminUserId", adminUser.id.toString())
            if (filterStatus !== "all") {
                params.append("status", filterStatus)
            }
            if (searchTerm) {
                params.append("search", searchTerm)
            }
            params.append("sortBy", sortConfig.key)
            params.append("sortOrder", sortConfig.direction)

            const response = await fetch(`/api/admin/orders?${params.toString()}`)
            if (response.ok) {
                const data: OrderWithUserDetails[] = await response.json()
                setOrders(data)
                telegramLogger.info(`Fetched ${data.length} admin orders.`, "OrderTable/fetchOrders")
            } else {
                const errorData = await response.json()
                telegramLogger.error(`Failed to fetch admin orders: ${errorData.error}`, "OrderTable/fetchOrders")
            }
        } catch (error: any) {
            telegramLogger.error(`Error fetching admin orders: ${error.message}`, "OrderTable/fetchOrders")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && isAuthenticated && adminUser) {
            fetchOrders()
        }
    }, [filterStatus, searchTerm, sortConfig, authLoading, isAuthenticated, adminUser]) // Refetch when filters/sort/auth change

    const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing for status update.", "OrderTable/handleStatusChange")
            return
        }
        setIsLoading(true) // Show loading state during update
        try {
            const response = await fetch("/api/admin/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus, adminUserId: adminUser.id }),
            })

            if (response.ok) {
                telegramLogger.info(`Order ${orderId} status updated to ${newStatus}.`, "OrderTable/handleStatusChange")
                await fetchOrders() // Refresh the list
            } else {
                const errorData = await response.json()
                telegramLogger.error(
                    `Failed to update order ${orderId} status: ${errorData.error}`,
                    "OrderTable/handleStatusChange",
                )
            }
        } catch (error: any) {
            telegramLogger.error(`Error updating order status: ${error.message}`, "OrderTable/handleStatusChange")
        } finally {
            setIsLoading(false)
        }
    }

    const requestSort = (key: keyof Order) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const getSortIcon = (key: keyof Order) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === "asc" ? (
                <ArrowUpDown className="ml-1 h-3 w-3 rotate-180" />
            ) : (
                <ArrowUpDown className="ml-1 h-3 w-3" />
            )
        }
        return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
    }

    if (isLoading) {
        return <ProductGridSkeleton count={3} /> // Reusing product skeleton for general loading indication
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                    <Package className="h-5 w-5 mr-2" /> All Orders
                </CardTitle>
                <CardDescription>Manage and track customer orders.</CardDescription>
                <div className="flex space-x-2 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search orders by ID, user, address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as OrderStatus | "all")}>
                        <SelectTrigger className="w-[180px]">
                            <ListFilter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchOrders} aria-label="Refresh Orders">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No orders found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px] cursor-pointer" onClick={() => requestSort("id")}>
                                        ID {getSortIcon("id")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => requestSort("user_id")}>
                                        Customer {getSortIcon("user_id")}
                                    </TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead
                                        className="w-[120px] text-right cursor-pointer"
                                        onClick={() => requestSort("total_amount")}
                                    >
                                        Total {getSortIcon("total_amount")}
                                    </TableHead>
                                    <TableHead className="w-[150px] cursor-pointer" onClick={() => requestSort("status")}>
                                        Status {getSortIcon("status")}
                                    </TableHead>
                                    <TableHead className="w-[150px] cursor-pointer" onClick={() => requestSort("created_at")}>
                                        Date {getSortIcon("created_at")}
                                    </TableHead>
                                    <TableHead className="text-center">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <TableCell className="font-medium">#{order.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <User className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <p className="font-semibold">{order.user_first_name || "N/A"}</p>
                                                    <p className="text-sm text-gray-500">@{order.user_username || order.user_id}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{order.delivery_address}</p>
                                            <p className="text-xs text-gray-400">{order.phone_number}</p>
                                        </TableCell>
                                        <TableCell>
                                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                                {order.items?.map((item) => (
                                                    <li key={item.id}>
                                                        {item.quantity}x {item.product.name} ({formatCurrency(item.price)})
                                                    </li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            {formatCurrency(toNumber(order.total_amount))}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={order.status}
                                                onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}
                                            >
                                                <SelectTrigger className="w-[120px] text-xs">
                                                    <Badge
                                                        className={cn(
                                                            "text-white py-1 px-2 rounded-full",
                                                            order.status === "pending" && "bg-yellow-500",
                                                            order.status === "confirmed" && "bg-blue-500",
                                                            order.status === "preparing" && "bg-orange-500",
                                                            order.status === "ready" && "bg-green-500",
                                                            order.status === "delivered" && "bg-gray-500",
                                                            order.status === "cancelled" && "bg-red-500",
                                                        )}
                                                    >
                                                        <SelectValue />
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(order.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    alert(
                                                        `Order notes: ${order.notes || "None"}\nDelivery: ${order.delivery_address}\nPhone: ${order.phone_number}`,
                                                    )
                                                }
                                            >
                                                View
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
