"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

interface OrderSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  dinerName?: string
}

export function OrderSuccessModal({ isOpen, onClose, orderId, dinerName }: OrderSuccessModalProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getRestaurantId = (): string => {
    if (pathname.startsWith("/r/")) {
      return pathname.split("/")[2] || "rest_mote"
    }

    const stored = localStorage.getItem("currentRestaurantId")
    return stored || "rest_mote"
  }

  const handleGoToMenu = () => {
    onClose()
    // Already on menu page, just close modal
  }

  const handleGoToOrders = () => {
    onClose()
    const restaurantId = getRestaurantId()
    console.log("[v0] Order success - navigating to orders:", `/orders/${restaurantId}`)
    router.push(`/orders/${restaurantId}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto rounded-2xl md:w-full md:rounded-xl">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center md:w-20 md:h-20">
              <CheckCircle className="w-8 h-8 text-green-600 md:w-10 md:h-10" />
            </div>
            <DialogTitle className="text-xl font-bold md:text-2xl">Order Placed Successfully!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-center space-y-4 md:space-y-6">
          {dinerName && <p className="text-lg font-semibold md:text-xl">Thank you, {dinerName}!</p>}
          <p className="text-base text-muted-foreground leading-relaxed md:text-lg">
            Your order has been placed and sent to the kitchen.
          </p>
          <p className="text-base font-medium">
            Order Number: <span className="font-mono text-primary text-lg">#{orderId.slice(-8).toUpperCase()}</span>
          </p>
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-800 leading-relaxed md:text-base">
              You can track your order status and request your bill from the "Orders" page when your meal is ready.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4 md:pt-6">
            <Button
              onClick={handleGoToMenu}
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white min-h-[48px] text-base font-semibold rounded-xl"
            >
              Back to Menu
            </Button>
            <Button
              onClick={handleGoToOrders}
              variant="outline"
              className="w-full bg-transparent min-h-[48px] text-base font-medium rounded-xl"
            >
              Go to Orders
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
