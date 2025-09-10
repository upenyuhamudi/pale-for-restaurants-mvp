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
      <DialogContent className="w-[95vw] max-w-md mx-auto rounded-2xl md:w-full md:rounded-xl" hideClose>
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold md:text-2xl">Welcome!</DialogTitle>
          <DialogDescription className="text-base leading-relaxed md:text-lg">
            Please enter your table number to get started with your order.
            <br />
            <span className="text-sm text-muted-foreground mt-2 block md:text-base">
              Your table number helps us deliver your order to the right location.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 md:space-y-8 md:py-6">
          <div className="text-center">
            <label htmlFor="name-input" className="block text-base font-medium text-muted-foreground mb-3">
              Your Name
            </label>
            <Input
              id="name-input"
              value={dinerName}
              onChange={(e) => setDinerName(e.target.value)}
              placeholder="Enter your name"
              className="text-center text-lg font-medium h-14 min-h-[48px] rounded-xl md:text-xl md:h-16"
              autoFocus
            />
          </div>

          <div className="text-center">
            <label htmlFor="table-input" className="block text-base font-medium text-muted-foreground mb-3">
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
              className="text-center text-2xl font-bold h-16 text-primary min-h-[48px] rounded-xl md:text-3xl md:h-20"
              maxLength={3}
            />
          </div>

          <div className="flex flex-col gap-4 pt-4 md:flex-row md:pt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent min-h-[48px] text-base font-medium rounded-xl order-2 md:order-1"
              size="lg"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!dinerName.trim() || !tableNumber.trim() || isLoading}
              className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white min-h-[48px] text-base font-semibold rounded-xl order-1 md:order-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
