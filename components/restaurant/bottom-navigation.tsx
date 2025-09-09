"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShoppingCart, Receipt, Home } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { CartSidebar } from "./cart-sidebar"

export function BottomNavigation() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { getCartTotal, getCartItemCount } = useCartStore()
  const router = useRouter()
  const pathname = usePathname()

  const itemCount = getCartItemCount()
  const total = getCartTotal()

  const isMenuPage = pathname.startsWith("/r/")
  const isOrdersPage = pathname.startsWith("/orders/")

  const getRestaurantId = (): string => {
    console.log("[v0] === RESTAURANT ID EXTRACTION DEBUG ===")
    console.log("[v0] Current pathname:", pathname)
    console.log("[v0] Pathname type:", typeof pathname)
    console.log("[v0] Pathname length:", pathname.length)

    // Extract from current path
    if (pathname.startsWith("/r/")) {
      const parts = pathname.split("/")
      console.log("[v0] Path parts:", parts)
      const id = parts[2]
      console.log("[v0] Extracted ID from menu path:", id)
      console.log("[v0] ID type:", typeof id)
      console.log("[v0] ID length:", id?.length)

      if (id && id.trim() !== "") {
        console.log("[v0] Using extracted ID:", id)
        return id
      }
    }

    if (pathname.startsWith("/orders/")) {
      const parts = pathname.split("/")
      console.log("[v0] Orders path parts:", parts)
      const id = parts[2]
      console.log("[v0] Extracted ID from orders path:", id)

      if (id && id.trim() !== "") {
        console.log("[v0] Using extracted orders ID:", id)
        return id
      }
    }

    // Try localStorage as backup
    const stored = localStorage.getItem("currentRestaurantId")
    console.log("[v0] Stored restaurant ID:", stored)
    if (stored && stored.trim() !== "") {
      console.log("[v0] Using stored restaurant ID:", stored)
      return stored
    }

    console.log("[v0] Using fallback restaurant ID: rest_mote")
    return "rest_mote"
  }

  const handleMenuClick = () => {
    if (isOrdersPage) {
      const restaurantId = getRestaurantId()
      router.push(`/r/${restaurantId}`)
    }
  }

  const handleOrdersClick = () => {
    console.log("[v0] === ORDERS NAVIGATION DEBUG ===")
    const restaurantId = getRestaurantId()
    console.log("[v0] Final restaurant ID:", restaurantId)
    console.log("[v0] Restaurant ID type:", typeof restaurantId)
    console.log("[v0] Restaurant ID length:", restaurantId.length)

    const ordersPath = `/orders/${restaurantId}`
    console.log("[v0] Constructed orders path:", ordersPath)
    console.log("[v0] Orders path type:", typeof ordersPath)
    console.log("[v0] Orders path length:", ordersPath.length)

    localStorage.setItem("currentRestaurantId", restaurantId)
    console.log("[v0] Stored restaurant ID in localStorage:", restaurantId)

    console.log("[v0] About to call router.push with:", ordersPath)
    try {
      router.push(ordersPath)
      console.log("[v0] router.push called successfully")
    } catch (error) {
      console.error("[v0] Error during router.push:", error)
    }
  }

  const handleCartClick = () => {
    setIsCartOpen(true)
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMenuClick}
            className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 px-3 transition-colors ${
              isMenuPage
                ? "text-brand-orange bg-brand-orange/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Menu</span>
          </Button>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCartClick}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-brand-orange"
                >
                  {itemCount}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium">Cart</span>
              {total > 0 && <span className="text-xs text-brand-orange font-semibold">{formatCurrency(total)}</span>}
            </div>
          </Button>

          {/* Orders Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOrdersClick}
            className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 px-3 transition-colors ${
              isOrdersPage
                ? "text-brand-orange bg-brand-orange/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-xs font-medium">Orders</span>
          </Button>
        </div>
      </div>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6 h-full overflow-hidden">
            <CartSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
