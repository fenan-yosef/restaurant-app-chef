"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { config } from "@/lib/config"
import { telegramLogger } from "@/lib/telegram-logger"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()

    useEffect(() => {
        if (isLoading) {
            // Still loading auth state
            return
        }

        if (!isAuthenticated || !user) {
            telegramLogger.warn("Admin access denied: User not authenticated or user data missing.", "AdminLayout")
            router.replace("/") // Redirect to home if not authenticated
            return
        }

        // Check if the user's ID is in the list of admin chat IDs
        const isAdmin = config.app.adminChatIds.includes(user.id)
        telegramLogger.debug(`Admin check for user ${user.id}: ${isAdmin ? "Granted" : "Denied"}`, "AdminLayout")

        // --- DEBUGGING LOGS FOR ADMIN LAYOUT ---
        if (config.ui.showDebugInfo) {
            console.log("--- AdminLayout Debug ---")
            console.log("User ID:", user?.id)
            console.log("Is Authenticated:", isAuthenticated)
            console.log("Admin Chat IDs from config:", config.app.adminChatIds)
            console.log("Is current user ID in adminChatIds:", config.app.adminChatIds.includes(user.id))
            console.log("Final isAdmin status:", isAdmin)
            console.log("-------------------------")
        }
        // --- END DEBUGGING LOGS ---

        if (!isAdmin) {
            telegramLogger.warn(`Admin access denied: User ID ${user.id} is not in admin list.`, "AdminLayout")
            // Redirect to home or show an access denied page
            router.replace("/")
        }
    }, [isLoading, isAuthenticated, user, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // If not authenticated or not an admin, the useEffect will handle redirection.
    // Show a loading/denied state while redirecting or if there's a delay.
    const isAdmin = user && config.app.adminChatIds.includes(user.id)
    if (!isAuthenticated || !user || !isAdmin) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <ShieldAlert className="h-20 w-20 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-3">Access Denied</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                    You do not have permission to access the admin dashboard.
                </p>
                <Button onClick={() => router.push("/")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Home
                </Button>
                {config.ui.showDebugInfo && (
                    <div className="fixed bottom-0 left-0 right-0 bg-red-800 text-white p-2 text-xs z-50 overflow-auto max-h-1/3">
                        <h3 className="font-bold mb-1">ADMIN DEBUG INFO</h3>
                        <p>Auth Loading: {String(isLoading)}</p>
                        <p>Is Authenticated: {String(isAuthenticated)}</p>
                        <p>Current User ID: {user?.id || "N/A"}</p>
                        <p>Admin Chat IDs: {JSON.stringify(config.app.adminChatIds)}</p>
                        <p>Is current user ID in adminChatIds (rendered): {String(isAdmin)}</p>
                    </div>
                )}
            </div>
        )
    }

    // If authorized, render children
    return <div className="min-h-screen bg-background">{children}</div>
}
