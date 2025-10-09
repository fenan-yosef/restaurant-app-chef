"use client"

import { useState, useEffect } from "react"
import { useTelegram } from "@/hooks/useTelegram"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Package, Box, Users, BarChart2 } from "lucide-react" // Import Users icon
import OrderTable from "@/components/admin/OrderTable"
import ProductTable from "@/components/admin/ProductTable"
import UserTable from "@/components/admin/UserTable" // Import UserTable
import Analytics from "../../components/admin/Analytics"
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
        <div className="px-3 sm:px-6 lg:px-10 py-6 space-y-8 max-w-[1400px] mx-auto">
            <Card className="shadow-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">Admin Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Manage orders, products, and users for Chef Figoz Bakery.</p>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 p-1 gap-1">
                    <TabsTrigger
                        value="orders"
                        className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-600"
                    >
                        <Package className="h-4 w-4" />
                        <span>Orders</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="products"
                        className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-600"
                    >
                        <Box className="h-4 w-4" />
                        <span>Products</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="users"
                        className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-600"
                    >
                        <Users className="h-4 w-4" /> {/* New icon */}
                        <span>Users</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="analytics"
                        className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-600"
                    >
                        <BarChart2 className="h-4 w-4" />
                        <span>Analytics</span>
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
                <TabsContent value="analytics" className="mt-6">
                    <Analytics />
                </TabsContent>
            </Tabs>
        </div>
    )
}
