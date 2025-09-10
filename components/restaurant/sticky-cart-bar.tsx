"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { OrderSuccessModal } from "./order-success-modal"

interface MealData {
  id: string
  name: string
  price: number
}

export function StickyCartBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastOrderId, setLastOrderId] = useState("")
  const { cart, getCartTotal, getCartItemCount, removeLine, incrementLineQuantity, decrementLineQuantity, clearCart } =
    useCartStore()
  const [mealNames, setMealNames] = useState<Record<string, string>>({})
  const [mealPrices, setMealPrices] = useState<Record<string, number>>({})
  const itemCount = getCartItemCount()
  const total = getCartTotal()

  const placeOrder = async () => {
    if (!cart.table_number || cart.lines.length === 0) return

    setIsPlacingOrder(true)
    try {
      const supabase = createClient()

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: cart.restaurant_id,
          table_number: cart.table_number,
          diner_name: cart.diner_name,
          status: "pending",
          subtotal: total || 0,
          total: total || 0,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cart.lines.map((line) => ({
        order_id: orderData.id,
        item_type: line.type,
        item_id: line.id,
        item_name: line.name,
        quantity: line.quantity,
        unit_price: line.unitPrice || 0,
        total_price: (line.unitPrice || 0) * line.quantity,
        ...(line.type === "meal" && {
          side_ids: line.sideIds,
          extra_ids: line.extraIds,
          preferences: line.preferences,
        }),
        ...(line.type === "drink" && {
          variant: line.variant,
        }),
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      setLastOrderId(orderData.id)
      setShowSuccessModal(true)
      clearCart()
      setIsOpen(false)
    } catch (error) {
      console.error("Error placing order:", error)
      alert("Failed to place order. Please try again.")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const fetchMealNames = async (mealIds: string[]) => {
    if (mealIds.length === 0) return {}

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("meals").select("id, name, price").in("id", mealIds)

      if (error) {
        console.error("Error fetching meal names:", error)
        return {}
      }

      const nameMap: Record<string, string> = {}
      const priceMap: Record<string, number> = {}
      data?.forEach((meal: any) => {
        nameMap[meal.id] = meal.name
        priceMap[meal.id] = meal.price || 0
      })
      setMealPrices(priceMap)
      return nameMap
    } catch (error) {
      console.error("Error fetching meal names:", error)
      return {}
    }
  }

  useEffect(() => {
    const allMealIds = new Set<string>()

    cart.lines.forEach((line) => {
      if (line.type === "meal") {
        line.sideIds.forEach((id) => allMealIds.add(id))
        line.extraIds.forEach((id) => allMealIds.add(id))
      }
    })

    if (allMealIds.size > 0) {
      fetchMealNames(Array.from(allMealIds)).then(setMealNames)
    }
  }, [cart.lines])

  if (itemCount === 0) {
    return null
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50 shadow-lg md:p-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-14 text-base font-semibold min-h-[48px] leading-tight md:text-base"
              size="lg"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 md:w-5 md:h-5" />
                  <span className="leading-tight">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="font-bold leading-tight">{formatCurrency(total ?? 0)}</span>
              </div>
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[85vh] md:h-[80vh]">
            <SheetHeader>
              <SheetTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-xl font-bold leading-tight md:text-lg">Your Order</span>
                {cart.table_number && (
                  <div className="text-center md:text-right">
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-sm font-medium">
                      Table {cart.table_number}
                    </Badge>
                    {cart.diner_name && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cart.diner_name}</p>
                    )}
                  </div>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6 md:mt-6">
              <div className="space-y-4 max-h-[45vh] overflow-y-auto md:space-y-4 md:max-h-[50vh]">
                {cart.lines.map((line, index) => (
                  <div key={index} className="space-y-3 p-4 rounded-xl border md:space-y-3 md:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold leading-tight text-base md:text-base">{line.name}</h4>

                        {line.type === "meal" && (
                          <div className="mt-3 space-y-3">
                            <div className="flex justify-between items-center py-2 px-3 bg-muted/20 rounded-lg">
                              <span className="text-sm text-muted-foreground leading-relaxed md:text-sm">
                                Base meal
                              </span>
                              <span className="text-sm font-semibold leading-tight md:text-sm">
                                {formatCurrency(
                                  ((line.unitPrice || 0) -
                                    line.extraIds.reduce((sum, id) => sum + (mealPrices[id] || 0), 0)) *
                                    line.quantity,
                                )}
                              </span>
                            </div>

                            {line.sideIds.length > 0 && (
                              <p className="text-sm text-muted-foreground leading-relaxed md:text-sm">
                                Sides: {line.sideIds.map((id) => mealNames[id] || id).join(", ")}
                              </p>
                            )}
                            {line.extraIds.length > 0 && (
                              <div className="space-y-2">
                                {line.extraIds.map((id) => (
                                  <div
                                    key={id}
                                    className="flex justify-between items-center py-3 px-4 bg-muted/30 rounded-lg"
                                  >
                                    <span className="text-sm font-semibold leading-tight md:text-sm">
                                      + {mealNames[id] || id}
                                    </span>
                                    <span className="text-primary font-bold text-sm leading-tight md:text-sm">
                                      {formatCurrency((mealPrices[id] || 0) * line.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {line.preferences && Object.keys(line.preferences).length > 0 && (
                              <p className="text-sm text-muted-foreground leading-relaxed md:text-sm">
                                {Object.entries(line.preferences)
                                  .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        )}

                        {line.type === "drink" && (
                          <p className="text-sm text-muted-foreground capitalize mt-2 leading-relaxed md:text-sm">
                            {line.variant}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold text-base leading-tight md:text-base">
                          {formatCurrency((line.unitPrice ?? 0) * line.quantity)}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed md:text-sm">
                          {formatCurrency(line.unitPrice ?? 0)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 bg-transparent min-h-[48px] min-w-[48px] md:h-8 md:w-8 md:min-h-[32px] md:min-w-[32px]"
                          onClick={() => decrementLineQuantity(index)}
                          disabled={line.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold w-8 text-center text-base leading-tight md:text-base">
                          {line.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 bg-transparent min-h-[48px] min-w-[48px] md:h-8 md:w-8 md:min-h-[32px] md:min-w-[32px]"
                          onClick={() => incrementLineQuantity(index)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive min-h-[48px] px-4 text-base font-medium leading-tight md:min-h-[32px] md:text-sm"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4 md:space-y-4">
                <div className="flex justify-between items-center text-xl font-bold leading-tight md:text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total ?? 0)}</span>
                </div>

                <Button
                  className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white min-h-[48px] text-base font-semibold leading-tight"
                  size="lg"
                  disabled={!cart.table_number || isPlacingOrder}
                  onClick={placeOrder}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <OrderSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} orderId={lastOrderId} />
    </>
  )
}
