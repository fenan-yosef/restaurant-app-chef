"use client"

import { useState, useEffect } from "react"
import { useTelegram } from "@/hooks/useTelegram"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Package, Box, Users } from "lucide-react" // Import Users icon
import OrderTable from "@/components/admin/OrderTable"
import ProductTable from "@/components/admin/ProductTable"
import UserTable from "@/components/admin/UserTable" // Import UserTable
import { telegramLogger } from "@/lib/telegram-logger"

export default function AdminDashboardPage() {
    const { showBackButton, hideMainButton } = useTelegram()
    const [activeTab, setActiveTab] = useState("orders")

    useEffect(() => {
        showBackButton(() => {
            // This will cause a full page reload if navigating back to home
            window.location.href = "/"
        })
        hideMainButton()
    }, [showBackButton, hideMainButton])

    useEffect(() => {
        telegramLogger.info(`Admin Dashboard: Switched to tab: ${activeTab}`, "AdminDashboardPage")
    }, [activeTab])

    return (
        <div className="p-4 space-y-6">
            <Card className="glass shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold gradient-text">Admin Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">Manage orders, products, and users for Chef Figoz Bakery.</p>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700"> {/* Changed grid-cols-2 to 3 */}
                    <TabsTrigger
                        value="orders"
                        className="flex items-center justify-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
                    >
                        <Package className="h-4 w-4" />
                        <span>Orders</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="products"
                        className="flex items-center justify-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
                    >
                        <Box className="h-4 w-4" />
                        <span>Products</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="users"
                        className="flex items-center justify-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
                    >
                        <Users className="h-4 w-4" /> {/* New icon */}
                        <span>Users</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-6">
                    <OrderTable />
                </TabsContent>
                <TabsContent value="products" className="mt-6">
                    <ProductTable />
                </TabsContent>
                <TabsContent value="users" className="mt-6"> {/* New tab content */}
                    <UserTable />
                </TabsContent>
            </Tabs>
        </div>
    )
}
