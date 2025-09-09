"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { OrderSuccessModal } from "./order-success-modal"

interface MealData {
  id: string
  name: string
  price: number
}

export function CartSidebar() {
  const { cart, getCartTotal, getCartItemCount, removeLine, incrementLineQuantity, decrementLineQuantity, clearCart } =
    useCartStore()
  const [mealNames, setMealNames] = useState<Record<string, string>>({})
  const [mealPrices, setMealPrices] = useState<Record<string, number>>({})
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastOrderId, setLastOrderId] = useState("")
  const [orderCartData, setOrderCartData] = useState<{ diner_name?: string }>({})
  const itemCount = getCartItemCount()
  const total = getCartTotal()

  useEffect(() => {
    console.log("[v0] Success modal state changed:", showSuccessModal)
    if (showSuccessModal) {
      console.log("[v0] Modal should be visible now with order ID:", lastOrderId)
      console.log("[v0] Diner name in modal:", orderCartData.diner_name)
    }
  }, [showSuccessModal, lastOrderId, orderCartData.diner_name])

  const placeOrder = async () => {
    if (!cart.table_number || cart.lines.length === 0) return

    console.log("[v0] Placing order with cart data:", {
      table_number: cart.table_number,
      diner_name: cart.diner_name,
      restaurant_id: cart.restaurant_id,
      total: total,
    })

    setIsPlacingOrder(true)
    try {
      const supabase = createClient()

      const orderData = {
        restaurant_id: cart.restaurant_id,
        table_number: cart.table_number,
        diner_name: cart.diner_name || "Unknown", // Added fallback for diner_name
        status: "pending",
        subtotal: total || 0,
        total: total || 0,
      }

      console.log("[v0] Inserting order with data:", orderData)

      const { data: orderResult, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) {
        console.error("[v0] Order insert error:", orderError)
        throw orderError
      }

      console.log("[v0] Order created successfully:", orderResult)

      const orderItems = cart.lines.map((line) => ({
        order_id: orderResult.id,
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

      console.log("[v0] Setting success modal state - Order ID:", orderResult.id)
      console.log("[v0] Diner name for modal:", cart.diner_name)

      setOrderCartData({ diner_name: cart.diner_name })
      setLastOrderId(orderResult.id)

      setTimeout(() => {
        console.log("[v0] Setting success modal to true after timeout")
        setShowSuccessModal(true)
      }, 100)

      console.log("[v0] Success modal state set to true")

      console.log("[v0] Cart will be cleared when modal closes")
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
    return (
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-semibold text-lg mb-4">Your Order</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">🛒</span>
          </div>
          <p className="text-muted-foreground text-sm mb-2">Your cart is empty</p>
          <p className="text-xs text-muted-foreground">Add items from the menu to get started</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Your Order</h3>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        {cart.table_number && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Table {cart.table_number}</p>
            {cart.diner_name && <p className="text-sm text-muted-foreground">{cart.diner_name}</p>}
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {cart.lines.map((line, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight">{line.name}</p>

                  {line.type === "meal" && (
                    <div className="mt-1 space-y-1">
                      

                      {line.sideIds.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Sides: </span>
                          {line.sideIds.map((id, idx) => (
                            <span key={id} className="text-muted-foreground">
                              {mealNames[id] || id}
                              {idx < line.sideIds.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {line.extraIds.length > 0 && (
                        <div className="text-xs space-y-1">
                          {line.extraIds.map((id) => (
                            <div key={id} className="flex justify-between items-center py-1 px-2 bg-muted/30 rounded">
                              <span className="text-foreground font-medium">+ {mealNames[id] || id}</span>
                              <span className="text-primary font-semibold">
                                {formatCurrency((mealPrices[id] || 0) * line.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {line.preferences && Object.keys(line.preferences).length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {Object.entries(line.preferences)
                            .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {line.type === "drink" && (
                    <p className="text-xs text-muted-foreground capitalize mt-1">{line.variant}</p>
                  )}

                  <div className="flex items-center justify-between mt-2 mr-0 w-[115%]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 bg-transparent"
                        onClick={() => decrementLineQuantity(index)}
                        disabled={line.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{line.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 bg-transparent"
                        onClick={() => incrementLineQuantity(index)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="w-3 h-3 flex-col justify-end items-end" />
                    </Button>
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <p className="font-medium text-sm">{formatCurrency((line.unitPrice || 0) * line.quantity)}</p>
                  
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Subtotal</span>
            <span className="font-semibold">{formatCurrency(total || 0)}</span>
          </div>

          <Button
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white"
            size="lg"
            disabled={itemCount === 0 || !cart.table_number || isPlacingOrder}
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

          <p className="text-xs text-muted-foreground text-center">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          console.log("[v0] Success modal closed")
          setShowSuccessModal(false)
          clearCart()
          console.log("[v0] Cart cleared after modal close")
        }}
        orderId={lastOrderId}
        dinerName={orderCartData.diner_name} // Use stored cart data instead of current cart
      />
    </>
  )
}
