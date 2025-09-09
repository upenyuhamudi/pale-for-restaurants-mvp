"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw, Clock, CheckCircle, Utensils, Phone, Receipt } from "lucide-react"
import { BottomNavigation } from "@/components/restaurant/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Order {
  id: string
  table_number: string
  diner_name: string
  status: string
  total: number
  created_at: string
  order_items: OrderItem[]
  bill_requested: boolean
  waiter_called: boolean
}

interface OrderItem {
  id: string
  item_type: string
  item_id: string
  item_name: string
  variant: string | null
  quantity: number
  unit_price: number
  total_price: number
  side_ids: string[] | null
  extra_ids: string[] | null
  preferences: any | null
}

export default function OrdersPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const router = useRouter()

  const [dinerName, setDinerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [meals, setMeals] = useState<any[]>([])
  const [drinks, setDrinks] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBillRequesting, setIsBillRequesting] = useState(false)
  const [isWaiterCalling, setIsWaiterCalling] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem("currentRestaurantId", restaurantId)
      console.log("[v0] Stored restaurant ID:", restaurantId)
    }
  }, [restaurantId])

  const fetchMenuData = async () => {
    try {
      console.log("[v0] Fetching menu data for restaurant:", restaurantId)
      const [mealsResponse, drinksResponse] = await Promise.all([
        supabase.from("meals").select("*").eq("restaurant_id", restaurantId),
        supabase.from("drinks").select("*").eq("restaurant_id", restaurantId),
      ])

      if (mealsResponse.data) setMeals(mealsResponse.data)
      if (drinksResponse.data) setDrinks(drinksResponse.data)
      console.log("[v0] Menu data fetched successfully")
    } catch (error) {
      console.error("[v0] Error fetching menu data:", error)
      setError("Error loading menu data")
    }
  }

  useEffect(() => {
    if (restaurantId) {
      fetchMenuData()
    }
  }, [restaurantId])

  const resolveSideNames = (sideIds: string[]): string => {
    return sideIds
      .map((id) => {
        // Check if it's already a readable name (contains spaces or proper capitalization)
        if (id.includes(" ") || /[A-Z]/.test(id.slice(1))) {
          return id
        }

        // Try to find in meals data
        const foundSide = meals.find((meal) => meal.id === id)
        if (foundSide) return foundSide.name

        // Parse ID to create readable name
        return id
          .replace(/^meal_mote_/, "")
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      })
      .join(", ")
  }

  const resolveExtraNames = (extraIds: string[]): string => {
    return extraIds
      .map((id) => {
        // Check if it's already a readable name
        if (id.includes(" ") || /[A-Z]/.test(id.slice(1))) {
          return id
        }

        // Try to find in meals data
        const foundExtra = meals.find((meal) => meal.id === id)
        if (foundExtra) return foundExtra.name

        // Parse ID to create readable name
        return id
          .replace(/^meal_mote_/, "")
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      })
      .join(", ")
  }

  const fetchOrders = async () => {
    if (!dinerName.trim() || !tableNumber.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      console.log("[v0] Fetching orders for:", { restaurantId, dinerName, tableNumber })
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("restaurant_id", restaurantId)
        .eq("diner_name", dinerName.trim())
        .eq("table_number", tableNumber.trim())
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching orders:", error)
        setError(`Error fetching orders: ${error.message}`)
        setOrders([])
      } else {
        console.log("[v0] Orders fetched successfully:", ordersData?.length || 0)
        setOrders(ordersData || [])
      }
      setHasSearched(true)
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      setError("Unexpected error while fetching orders")
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchOrders()
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  const handleBrowseMenu = () => {
    // Store diner information in localStorage for cart to use
    localStorage.setItem("dinerName", dinerName)
    localStorage.setItem("tableNumber", tableNumber)
    console.log("[v0] Stored diner info for menu browsing:", { dinerName, tableNumber })

    // Navigate to restaurant menu
    router.push(`/r/${restaurantId}`)
  }

  const handleBillRequest = async () => {
    if (!dinerName.trim() || !tableNumber.trim()) return

    setIsBillRequesting(true)
    try {
      console.log("[v0] Requesting bill for:", { dinerName, tableNumber })

      // Update all orders for this diner/table to mark bill as requested
      const { error } = await supabase
        .from("orders")
        .update({ bill_requested: true })
        .eq("restaurant_id", restaurantId)
        .eq("diner_name", dinerName.trim())
        .eq("table_number", tableNumber.trim())

      if (error) {
        console.error("[v0] Error requesting bill:", error)
        setError(`Error requesting bill: ${error.message}`)
      } else {
        console.log("[v0] Bill requested successfully")
        // Refresh orders to show updated status
        await fetchOrders()
      }
    } catch (error) {
      console.error("[v0] Error requesting bill:", error)
      setError("Unexpected error while requesting bill")
    } finally {
      setIsBillRequesting(false)
    }
  }

  const handleWaiterCall = async () => {
    if (!dinerName.trim() || !tableNumber.trim()) return

    setIsWaiterCalling(true)
    try {
      console.log("[v0] Calling waiter for:", { dinerName, tableNumber })

      // Update all orders for this diner/table to mark waiter as called
      const { error } = await supabase
        .from("orders")
        .update({ waiter_called: true })
        .eq("restaurant_id", restaurantId)
        .eq("diner_name", dinerName.trim())
        .eq("table_number", tableNumber.trim())

      if (error) {
        console.error("[v0] Error calling waiter:", error)
        setError(`Error calling waiter: ${error.message}`)
      } else {
        console.log("[v0] Waiter called successfully")
        // Refresh orders to show updated status
        await fetchOrders()
      }
    } catch (error) {
      console.error("[v0] Error calling waiter:", error)
      setError("Unexpected error while calling waiter")
    } finally {
      setIsWaiterCalling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
      ready: { label: "Confirmed", variant: "default" as const, icon: Utensils },
      completed: { label: "Served", variant: "default" as const, icon: CheckCircle },
      // Legacy statuses for backward compatibility
      preparing: { label: "Confirmed", variant: "default" as const, icon: Utensils },
      delivered: { label: "Served", variant: "default" as const, icon: CheckCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        <div className="mb-8">
          <Link
            href={`/r/${restaurantId}`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 md:hidden"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Link>

          {(!hasSearched || orders.length === 0) && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Track Your Orders</h1>
              <p className="text-muted-foreground mb-6">Enter your name and table number to view your order status</p>

              {error && (
                <Card className="max-w-md mx-auto mb-4 border-destructive">
                  <CardContent className="pt-4">
                    <p className="text-destructive text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Your Name
                      </label>
                      <Input
                        id="name"
                        value={dinerName}
                        onChange={(e) => setDinerName(e.target.value)}
                        placeholder="Enter your name"
                        className="text-center"
                      />
                    </div>

                    <div>
                      <label htmlFor="table" className="block text-sm font-medium mb-2">
                        Table Number
                      </label>
                      <Input
                        id="table"
                        value={tableNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 3)
                          setTableNumber(value)
                        }}
                        placeholder="Enter table number"
                        className="text-center text-lg font-semibold"
                        maxLength={3}
                      />
                    </div>

                    <Button
                      onClick={handleSearch}
                      disabled={!dinerName.trim() || !tableNumber.trim() || isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "View My Orders"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasSearched && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                  Orders for {dinerName} - Table {tableNumber}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {orders.length > 0 && (
                <div className="space-y-3 mb-6">
                  <Button onClick={handleBrowseMenu} className="w-full" size="lg">
                    <Utensils className="w-4 h-4 mr-2" />
                    Browse Menu & Add Items
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${orders.some((order) => order.bill_requested) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-transparent"}`}
                      onClick={handleBillRequest}
                      disabled={isBillRequesting || orders.some((order) => order.bill_requested)}
                    >
                      {isBillRequesting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Receipt className="w-4 h-4 mr-2" />
                      )}
                      {orders.some((order) => order.bill_requested) ? "Bill Requested" : "Bill Request"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${orders.some((order) => order.waiter_called) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-transparent"}`}
                      onClick={handleWaiterCall}
                      disabled={isWaiterCalling || orders.some((order) => order.waiter_called)}
                    >
                      {isWaiterCalling ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Phone className="w-4 h-4 mr-2" />
                      )}
                      {orders.some((order) => order.waiter_called) ? "Waiter Called" : "Call Waiter"}
                    </Button>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No orders found for {dinerName} at Table {tableNumber}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.item_name}</span>
                                {item.variant && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.variant}
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                              </div>
                              {item.side_ids && item.side_ids.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Sides: {resolveSideNames(item.side_ids)}
                                </p>
                              )}
                              {item.extra_ids && item.extra_ids.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Extras: {resolveExtraNames(item.extra_ids)}
                                </p>
                              )}
                              {item.preferences && Object.keys(item.preferences).length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Preferences:{" "}
                                  {Object.entries(item.preferences)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">R{item.total_price.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">R{item.unit_price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center font-semibold text-lg">
                            <span>Total</span>
                            <span>R{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
