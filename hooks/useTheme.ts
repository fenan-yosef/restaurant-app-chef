"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { useTelegram } from "./useTelegram"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: "light" | "dark"
    isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}

export function useThemeLogic() {
    const [theme, setTheme] = useState<Theme>("system")
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
    const [isLoading, setIsLoading] = useState(true)
    const { webApp } = useTelegram()

    useEffect(() => {
        const applyTheme = () => {
            let finalTheme: "light" | "dark" = "light"

            // Check if we're in Telegram environment
            if (webApp && webApp.colorScheme) {
                finalTheme = webApp.colorScheme === "dark" ? "dark" : "light"
                setTheme(finalTheme)

                // Apply Telegram theme colors as CSS variables
                const root = document.documentElement
                root.style.setProperty(
                    "--tg-bg-color",
                    webApp.backgroundColor || (finalTheme === "dark" ? "#212121" : "#ffffff"),
                )
                root.style.setProperty(
                    "--tg-text-color",
                    webApp.themeParams?.text_color || (finalTheme === "dark" ? "#ffffff" : "#000000"),
                )
                root.style.setProperty(
                    "--tg-hint-color",
                    webApp.themeParams?.hint_color || (finalTheme === "dark" ? "#aaaaaa" : "#999999"),
                )
                root.style.setProperty(
                    "--tg-link-color",
                    webApp.themeParams?.link_color || (finalTheme === "dark" ? "#8774e1" : "#2481cc"),
                )
                root.style.setProperty(
                    "--tg-button-color",
                    webApp.themeParams?.button_color || (finalTheme === "dark" ? "#8774e1" : "#2481cc"),
                )
                root.style.setProperty("--tg-button-text-color", webApp.themeParams?.button_text_color || "#ffffff")
                root.style.setProperty(
                    "--tg-secondary-bg-color",
                    webApp.themeParams?.secondary_bg_color || (finalTheme === "dark" ? "#181818" : "#f1f1f1"),
                )
            } else {
                // Use system theme for standalone web app
                const savedTheme = typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme) : null
                const currentTheme = savedTheme || theme

                if (currentTheme === "system" || !savedTheme) {
                    finalTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
                } else {
                    finalTheme = currentTheme as "light" | "dark"
                }

                if (!savedTheme) {
                    setTheme("system")
                }
            }

            setResolvedTheme(finalTheme)

            // Apply theme classes
            document.documentElement.classList.remove("light", "dark")
            document.documentElement.classList.add(finalTheme)

            // Set data attribute for better CSS targeting
            document.documentElement.setAttribute("data-theme", finalTheme)

            setIsLoading(false)
        }

        // Initial theme application
        applyTheme()

        // Listen for system theme changes
        if (!webApp) {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
            const handleChange = () => {
                if (theme === "system") {
                    applyTheme()
                }
            }

            mediaQuery.addEventListener("change", handleChange)
            return () => mediaQuery.removeEventListener("change", handleChange)
        }
    }, [theme, webApp])

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme)
        if (!webApp && typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme)
        }
    }

    return {
        theme,
        setTheme: updateTheme,
        resolvedTheme,
        isLoading,
    }
}

export { ThemeContext }
