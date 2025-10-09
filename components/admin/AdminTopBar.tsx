"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutDashboard } from "lucide-react"

export default function AdminTopBar() {
    const router = useRouter()

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 dark:border-slate-800/60 bg-white/75 dark:bg-slate-900/70 backdrop-blur">
            <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                        <LayoutDashboard className="h-5 w-5 text-blue-600 dark:text-indigo-400" />
                        <span>Admin Dashboard</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Right-side actions placeholder */}
                </div>
            </div>
        </header>
    )
}
