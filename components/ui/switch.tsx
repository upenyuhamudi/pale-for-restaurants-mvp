"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked)

    const isControlled = onCheckedChange !== undefined
    const isChecked = isControlled ? checked : internalChecked

    const handleClick = () => {
      const newChecked = !isChecked
      if (isControlled) {
        onCheckedChange?.(newChecked)
      } else {
        setInternalChecked(newChecked)
      }
    }

    React.useEffect(() => {
      if (!isControlled) {
        setInternalChecked(checked)
      }
    }, [checked, isControlled])

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        ref={ref}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-primary" : "bg-input",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            isChecked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    )
  },
)
Switch.displayName = "Switch"

export { Switch }
