"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Search, RotateCcw } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { telegramLogger } from "@/lib/telegram-logger"
import ProductGridSkeleton from "@/components/LoadingStates/ProductGridSkeleton" // Reusing skeleton

interface UserData {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    created_at: string
    updated_at: string
}

export default function UserTable() {
    const { user: adminUser, isAuthenticated, isLoading: authLoading } = useAuth()
    const [users, setUsers] = useState<UserData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchUsers = async () => {
        if (!adminUser?.id) {
            telegramLogger.warn("Admin user ID missing, cannot fetch users.", "UserTable/fetchUsers")
            return
        }
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("adminUserId", adminUser.id.toString())

            const response = await fetch(`/api/admin/users?${params.toString()}`)
            if (response.ok) {
                const data: UserData[] = await response.json()
                setUsers(data)
                telegramLogger.info(`Fetched ${data.length} admin users.`, "UserTable/fetchUsers")
            } else {
                const errorData = await response.json()
                telegramLogger.error(`Failed to fetch admin users: ${errorData.error}`, "UserTable/fetchUsers")
            }
        } catch (error: any) {
            telegramLogger.error(`Error fetching admin users: ${error.message}`, "UserTable/fetchUsers")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && isAuthenticated && adminUser) {
            fetchUsers()
        }
    }, [authLoading, isAuthenticated, adminUser])

    const filteredUsers = users.filter((user) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase()
        return (
            user.id.toString().includes(lowerCaseSearchTerm) ||
            user.first_name.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.last_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
            user.username?.toLowerCase().includes(lowerCaseSearchTerm)
        )
    })

    if (isLoading) {
        return <ProductGridSkeleton count={3} /> // Reusing skeleton for loading
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                    <User className="h-5 w-5 mr-2" /> All Users
                </CardTitle>
                <CardDescription>View and manage registered users.</CardDescription>
                <div className="flex space-x-2 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search users by ID, name, username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchUsers} aria-label="Refresh Users">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Language</TableHead>
                                    <TableHead className="w-[150px]">Registered At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <TableCell className="font-medium">{user.id}</TableCell>
                                        <TableCell>
                                            {user.first_name} {user.last_name}
                                        </TableCell>
                                        <TableCell>@{user.username || "N/A"}</TableCell>
                                        <TableCell>{user.language_code || "N/A"}</TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(user.created_at).toLocaleString()}
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
