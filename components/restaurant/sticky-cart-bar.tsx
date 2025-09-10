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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-3 md:p-4 z-50 shadow-lg">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white min-h-[52px] text-base font-semibold"
              size="lg"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span>{formatCurrency(total ?? 0)}</span>
              </div>
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[85vh] md:h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-lg md:text-xl">Your Order</span>
                {cart.table_number && (
                  <div className="text-left sm:text-right">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Table {cart.table_number}
                    </Badge>
                    {cart.diner_name && <p className="text-xs text-muted-foreground mt-1">{cart.diner_name}</p>}
                  </div>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 md:mt-6 space-y-4">
              <div className="space-y-3 md:space-y-4 max-h-[55vh] md:max-h-[50vh] overflow-y-auto">
                {cart.lines.map((line, index) => (
                  <div key={index} className="space-y-3 p-3 md:p-4 rounded-lg border">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium leading-tight text-sm md:text-base">{line.name}</h4>

                        {line.type === "meal" && (
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between items-center py-1 px-2 bg-muted/20 rounded">
                              <span className="text-xs md:text-sm text-muted-foreground">Base meal</span>
                              <span className="text-xs md:text-sm font-medium">
                                {formatCurrency(
                                  ((line.unitPrice || 0) -
                                    line.extraIds.reduce((sum, id) => sum + (mealPrices[id] || 0), 0)) *
                                    line.quantity,
                                )}
                              </span>
                            </div>

                            {line.sideIds.length > 0 && (
                              <p className="text-xs md:text-sm text-muted-foreground">
                                Sides: {line.sideIds.map((id) => mealNames[id] || id).join(", ")}
                              </p>
                            )}
                            {line.extraIds.length > 0 && (
                              <div className="space-y-1">
                                {line.extraIds.map((id) => (
                                  <div
                                    key={id}
                                    className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg"
                                  >
                                    <span className="text-xs md:text-sm font-medium">+ {mealNames[id] || id}</span>
                                    <span className="text-primary font-semibold text-xs md:text-sm">
                                      {formatCurrency((mealPrices[id] || 0) * line.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {line.preferences && Object.keys(line.preferences).length > 0 && (
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {Object.entries(line.preferences)
                                  .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        )}

                        {line.type === "drink" && (
                          <p className="text-xs md:text-sm text-muted-foreground capitalize mt-1">{line.variant}</p>
                        )}
                      </div>
                      <div className="ml-3 text-right flex-shrink-0">
                        <p className="font-semibold text-sm md:text-base">
                          {formatCurrency((line.unitPrice ?? 0) * line.quantity)}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {formatCurrency(line.unitPrice ?? 0)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 md:h-8 md:w-8 bg-transparent"
                          onClick={() => decrementLineQuantity(index)}
                          disabled={line.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium w-8 text-center text-sm md:text-base">{line.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 md:h-8 md:w-8 bg-transparent"
                          onClick={() => incrementLineQuantity(index)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive min-h-[40px] md:min-h-[32px]"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg md:text-xl">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCurrency(total ?? 0)}</span>
                </div>

                <Button
                  className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white min-h-[52px] md:min-h-[44px]"
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
