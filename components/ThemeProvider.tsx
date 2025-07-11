"use client"

import type { ReactNode } from "react"
import { ThemeContext, useThemeLogic } from "@/hooks/useTheme"

export interface ThemeProviderProps {
    children: ReactNode
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
}

export function ThemeProvider({ children, attribute, defaultTheme, enableSystem }: ThemeProviderProps) {
    const themeLogic = useThemeLogic({ attribute, defaultTheme, enableSystem })
    return <ThemeContext.Provider value={themeLogic}>{children}</ThemeContext.Provider>
}
