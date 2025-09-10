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
      <DialogContent className="sm:max-w-md mx-4 md:mx-auto">
        <DialogHeader className="pb-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-lg md:text-xl font-semibold">Order Placed Successfully!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-center space-y-4">
          {dinerName && <p className="text-base md:text-lg font-medium">Thank you, {dinerName}!</p>}
          <p className="text-sm md:text-base text-muted-foreground">
            Your order has been placed and sent to the kitchen.
          </p>
          <p className="text-sm font-medium">
            Order Number: <span className="font-mono text-primary">#{orderId.slice(-8).toUpperCase()}</span>
          </p>
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
            <p className="text-xs md:text-sm text-blue-800">
              You can track your order status and request your bill from the "Orders" page when your meal is ready.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleGoToMenu}
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white min-h-[48px] md:min-h-[44px]"
            >
              Back to Menu
            </Button>
            <Button
              onClick={handleGoToOrders}
              variant="outline"
              className="w-full bg-transparent min-h-[48px] md:min-h-[44px]"
            >
              Go to Orders
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
