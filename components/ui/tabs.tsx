"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  orientation?: "horizontal" | "vertical"
}

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
  orientation: "horizontal" | "vertical"
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

const Tabs = ({ children, value, onValueChange, defaultValue = "", orientation = "horizontal" }: TabsProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (isControlled) {
        onValueChange?.(newValue)
      } else {
        setInternalValue(newValue)
        onValueChange?.(newValue)
      }
    },
    [isControlled, onValueChange],
  )

  return (
    <TabsContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        orientation,
      }}
    >
      {children}
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(TabsContext)

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation={context?.orientation}
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          context?.orientation === "vertical" ? "flex-col h-auto" : "h-10",
          className,
        )}
        {...props}
      />
    )
  },
)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const isSelected = context?.value === value

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50",
        className,
      )}
      onClick={() => context?.onValueChange(value)}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const isSelected = context?.value === value

  if (!isSelected) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
