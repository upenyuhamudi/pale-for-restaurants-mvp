"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface TableNumberModalProps {
  isOpen: boolean
  onClose: () => void
  onTableNumberSet: () => void
}

export function TableNumberModal({ isOpen, onClose, onTableNumberSet }: TableNumberModalProps) {
  const [dinerName, setDinerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setTableNumber: setStoreTableNumber, setDinerName: setStoreDinerName } = useCartStore()

  const handleConfirm = async () => {
    if (dinerName.trim() && tableNumber.trim()) {
      setIsLoading(true)
      // Simulate API call or processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("[v0] Setting table number:", tableNumber.trim(), "and diner name:", dinerName.trim())
      setStoreTableNumber(tableNumber.trim())
      setStoreDinerName(dinerName.trim())
      setIsLoading(false)
      onTableNumberSet()
    }
  }

  const handleCancel = () => {
    setDinerName("")
    setTableNumber("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold">Welcome!</DialogTitle>
          <DialogDescription className="text-base">
            Please enter your table number to get started with your order.
            <br />
            <span className="text-sm text-muted-foreground mt-1 block">
              Your table number helps us deliver your order to the right location.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <label htmlFor="name-input" className="block text-sm font-medium text-muted-foreground mb-2">
              Your Name
            </label>
            <Input
              id="name-input"
              value={dinerName}
              onChange={(e) => setDinerName(e.target.value)}
              placeholder="Enter your name"
              className="text-center text-lg font-medium h-12"
              autoFocus
            />
          </div>

          <div className="text-center">
            <label htmlFor="table-input" className="block text-sm font-medium text-muted-foreground mb-2">
              Table Number
            </label>
            <Input
              id="table-input"
              value={tableNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 3)
                setTableNumber(value)
              }}
              placeholder="Enter table number"
              className="text-center text-2xl font-semibold h-14 text-primary"
              maxLength={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent"
              size="lg"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!dinerName.trim() || !tableNumber.trim() || isLoading}
              className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                `Confirm Table ${tableNumber}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
