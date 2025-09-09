"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

const Select = ({
  children,
  value,
  onValueChange,
  defaultValue,
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const [open, setOpen] = React.useState(false)

  const currentValue = value !== undefined ? value : internalValue
  const setValue = onValueChange || setInternalValue

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: setValue,
        open,
        onOpenChange: setOpen,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onClick={() => context?.onOpenChange(!context.open)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext)
  return <span>{context?.value || placeholder}</span>
}

const SelectContent = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  const context = React.useContext(SelectContext)

  if (!context?.open) return null

  return (
    <div
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        className,
      )}
    >
      {children}
    </div>
  )
}

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className,
        )}
        onClick={() => {
          context?.onValueChange(value)
          context?.onOpenChange(false)
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)
SelectItem.displayName = "SelectItem"

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
