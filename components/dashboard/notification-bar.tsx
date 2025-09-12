"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Receipt, Phone, CheckCircle } from "lucide-react"

interface NotificationBarProps {
  restaurantId: string
}

interface NotificationCounts {
  openOrders: number
  billRequests: number
  waiterRequests: number
}

export function NotificationBar({ restaurantId }: NotificationBarProps) {
  const [counts, setCounts] = useState<NotificationCounts>({
    openOrders: 0,
    billRequests: 0,
    waiterRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCounts = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, waiter_called, bill_requested, table_closed")
        .eq("restaurant_id", restaurantId)

      if (error) throw error

      const openOrders = orders?.filter((order) => order.status === "pending" && !order.table_closed).length || 0

      const billRequests = orders?.filter((order) => order.bill_requested && !order.table_closed).length || 0

      const waiterRequests = orders?.filter((order) => order.waiter_called && !order.table_closed).length || 0

      setCounts({
        openOrders,
        billRequests,
        waiterRequests,
      })
    } catch (error) {
      console.error("[v0] Error fetching notification counts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()

    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel("notification-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          console.log("[v0] Orders updated, refetching notification counts...")
          fetchCounts()
        },
      )
      .subscribe()

    return () => {
      ordersSubscription.unsubscribe()
    }
  }, [restaurantId])

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalPending = counts.openOrders + counts.billRequests + counts.waiterRequests
  const hasNotifications = totalPending > 0

  return (
    <Card
      className={`mb-6 transition-all duration-300 ${
        hasNotifications
          ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-lg"
          : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
      }`}
    >
      <CardContent className="p-4">
        {hasNotifications ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                Action Required
              </h3>
              <Badge variant="destructive" className="text-sm font-bold">
                {totalPending} pending
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Open Orders */}
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  counts.openOrders > 0
                    ? "bg-orange-100 border-2 border-orange-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className={`p-2 rounded-full ${counts.openOrders > 0 ? "bg-orange-500" : "bg-gray-400"}`}>
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Open Orders</p>
                  <p className={`text-2xl font-bold ${counts.openOrders > 0 ? "text-orange-600" : "text-gray-500"}`}>
                    {counts.openOrders}
                  </p>
                </div>
                {counts.openOrders > 0 && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>

              {/* Bill Requests */}
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  counts.billRequests > 0
                    ? "bg-purple-100 border-2 border-purple-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className={`p-2 rounded-full ${counts.billRequests > 0 ? "bg-purple-500" : "bg-gray-400"}`}>
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Bill Requests</p>
                  <p className={`text-2xl font-bold ${counts.billRequests > 0 ? "text-purple-600" : "text-gray-500"}`}>
                    {counts.billRequests}
                  </p>
                </div>
                {counts.billRequests > 0 && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>

              {/* Waiter Requests */}
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  counts.waiterRequests > 0
                    ? "bg-blue-100 border-2 border-blue-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className={`p-2 rounded-full ${counts.waiterRequests > 0 ? "bg-blue-500" : "bg-gray-400"}`}>
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Waiter Requests</p>
                  <p className={`text-2xl font-bold ${counts.waiterRequests > 0 ? "text-blue-600" : "text-gray-500"}`}>
                    {counts.waiterRequests}
                  </p>
                </div>
                {counts.waiterRequests > 0 && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3 py-2">
            <div className="p-2 bg-green-500 rounded-full">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-700">All Caught Up!</h3>
              <p className="text-sm text-green-600">No pending orders or requests</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
