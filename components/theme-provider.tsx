"use client"

import * as React from "react"

type Theme = "dark" | "light" | "system"

interface ThemeProviderContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
}) {
  const [theme, setTheme] = React.useState<Theme>("light")

  return <ThemeProviderContext.Provider value={{ theme, setTheme }}>{children}</ThemeProviderContext.Provider>
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
