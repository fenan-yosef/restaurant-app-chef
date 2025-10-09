"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { telegramLogger } from "@/lib/telegram-logger"

type AnalyticsData = {
    totals: {
        orders: number
        revenueTotal: number
        revenueLast7Days: number
        products: number
        activeProducts: number
        users: number
    }
    ordersByStatus: { status: string; count: number }[]
    topProducts: { id: number; name: string; quantity: number; revenue: number }[]
    ordersPerDay: { day: string; count: number }[]
}

export default function Analytics() {
    const { user: adminUser, isAuthenticated, isLoading: authLoading } = useAuth()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAnalytics = async () => {
        if (!adminUser?.id) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/analytics?adminUserId=${adminUser.id}`)
            if (!res.ok) {
                const e = await res.json().catch(() => ({}))
                throw new Error(e.error || `HTTP ${res.status}`)
            }
            const json = (await res.json()) as AnalyticsData
            setData(json)
            telegramLogger.info(`Fetched analytics.`, "Admin/Analytics")
        } catch (err: any) {
            setError(err.message)
            telegramLogger.error(`Failed to fetch analytics: ${err.message}`, "Admin/Analytics")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && isAuthenticated && adminUser) {
            fetchAnalytics()
        }
    }, [authLoading, isAuthenticated, adminUser])

    const maxOrdersPerDay = useMemo(() => {
        return data?.ordersPerDay.reduce((m, d) => Math.max(m, d.count), 0) || 0
    }, [data])

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return <div className="text-red-600 dark:text-red-400">{error}</div>
    }

    if (!data) return null

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Revenue" value={formatCurrency(data.totals.revenueTotal)} />
                <StatCard title="Revenue (7d)" value={formatCurrency(data.totals.revenueLast7Days)} />
                <StatCard title="Orders" value={data.totals.orders.toString()} />
                <StatCard title="Active Products" value={`${data.totals.activeProducts}/${data.totals.products}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Orders by status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.ordersByStatus.map((s) => (
                                <span
                                    key={s.status}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    <span className="opacity-70 capitalize">{s.status}</span>
                                    <span className="text-blue-600 dark:text-indigo-400">{s.count}</span>
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.totals.users}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Registered users</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Orders per day (last 14 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-40 flex items-end gap-1">
                            {data.ordersPerDay.map((d) => {
                                const h = maxOrdersPerDay ? Math.round((d.count / maxOrdersPerDay) * 100) : 0
                                return (
                                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-blue-500/80 dark:bg-indigo-500/80 rounded-t"
                                            style={{ height: `${h}%` }}
                                            title={`${d.count} orders`}
                                        />
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                            {new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topProducts.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell className="text-right">{p.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm text-slate-500 dark:text-slate-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
