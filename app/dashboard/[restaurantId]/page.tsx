"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Clock,
  Users,
  ChefHat,
  Menu,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Receipt,
  X,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
  Utensils,
  Phone,
  ShoppingBag,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { MenuItemForm } from "@/components/dashboard/menu-item-form"

interface Order {
  id: string
  table_number: string
  diner_name: string
  status: "pending" | "ready" | "completed"
  total: number
  created_at: string
  updated_at: string
  bill_requested: boolean
  waiter_called: boolean
  table_closed: boolean
  order_items: OrderItem[]
}

interface OrderItem {
  id: string
  item_name: string
  item_type: "meal" | "drink"
  quantity: number
  unit_price: number
  total_price: number
  variant?: string
  side_ids?: string[]
  extra_ids?: string[]
  preferences?: Record<string, any>
}

interface Restaurant {
  id: string
  name: string
  logo_url?: string
  meals?: Meal[]
}

interface Meal {
  id: string
  name: string
  side_choices: string[]
  extra_choices: string[]
}

interface MenuItem {
  id: string
  name: string
  description: string
  price?: number
  pricing?: any
  category_id: string
  image_url?: string
  availability_status: "available" | "unavailable"
  dietary_category?: string
  allowed_sides?: number
  tasting_notes?: string[]
}

interface Analytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  averageServiceTime: number // in minutes
  ordersByStatus: Record<string, number>
  topItems: Array<{ name: string; count: number; revenue: number }>
  peakHours: Array<{ hour: number; count: number }>
}

export default function RestaurantDashboard() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [meals, setMeals] = useState<MenuItem[]>([])
  const [drinks, setDrinks] = useState<MenuItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeSection, setActiveSection] = useState<"orders" | "menu" | "analytics">("orders")
  const [menuTab, setMenuTab] = useState("meals")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemType, setItemType] = useState<"meal" | "drink">("meal")

  const [orderTab, setOrderTab] = useState("open")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tableFilter, setTableFilter] = useState<string>("all")

  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string; timestamp: string }>
  >([])
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)

  const [activeTab, setActiveTab] = useState("orders")

  const supabase = createClient()

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3")
      audio.play().catch((e) => console.log("Could not play notification sound:", e))
    } catch (error) {
      console.log("Audio not supported:", error)
    }
  }

  useEffect(() => {
    fetchRestaurant()
    fetchOrders()
    fetchMenuItems()
    fetchAnalytics()

    const refreshInterval = setInterval(() => {
      console.log("[v0] Auto-refreshing dashboard data...")
      fetchOrders()
      fetchAnalytics()
    }, 10000)

    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          console.log("[v0] Orders updated, refetching...")
          fetchOrders()
          fetchAnalytics()
        },
      )
      .subscribe()

    return () => {
      clearInterval(refreshInterval)
      ordersSubscription.unsubscribe()
    }
  }, [restaurantId])

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select(`
          id, 
          name, 
          logo_url,
          meals:meals(id, name, side_choices, extra_choices)
        `)
        .eq("id", restaurantId)
        .single()

      if (error) throw error
      setRestaurant(data)
    } catch (error) {
      console.error("[v0] Error fetching restaurant:", error)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError
      setOrders(ordersData || [])
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const [mealsResponse, drinksResponse] = await Promise.all([
        supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name"),
        supabase.from("drinks").select("*").eq("restaurant_id", restaurantId).order("name"),
      ])

      if (mealsResponse.error) throw mealsResponse.error
      if (drinksResponse.error) throw drinksResponse.error

      setMeals(mealsResponse.data || [])
      setDrinks(drinksResponse.data || [])
    } catch (error) {
      console.error("[v0] Error fetching menu items:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("restaurant_id", restaurantId)

      if (error) throw error

      const orders = ordersData || []
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      const completedOrders = orders.filter((order) => order.status === "completed")
      const totalServiceTime = completedOrders.reduce((sum, order) => {
        const created = new Date(order.created_at)
        const updated = new Date(order.updated_at)
        const serviceTimeMinutes = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60))
        return sum + serviceTimeMinutes
      }, 0)
      const averageServiceTime = completedOrders.length > 0 ? Math.round(totalServiceTime / completedOrders.length) : 0

      const ordersByStatus = orders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // Calculate top items
      const itemCounts = new Map<string, { count: number; revenue: number }>()
      orders.forEach((order) => {
        order.order_items?.forEach((item) => {
          const existing = itemCounts.get(item.item_name) || { count: 0, revenue: 0 }
          itemCounts.set(item.item_name, {
            count: existing.count + item.quantity,
            revenue: existing.revenue + item.total_price,
          })
        })
      })

      const topItems = Array.from(itemCounts.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const hourCounts = new Map<number, number>()
      orders.forEach((order) => {
        const hour = new Date(order.created_at).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      })

      const peakHours = Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      setAnalytics({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        averageServiceTime,
        ordersByStatus,
        topItems,
        peakHours,
      })
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "ready" | "completed") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) throw error

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order,
        ),
      )
    } catch (error) {
      console.error("[v0] Error updating order status:", error)
    }
  }

  const closeTable = async (tableNumber: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ table_closed: true })
        .eq("table_number", tableNumber)
        .eq("restaurant_id", restaurantId)

      if (error) throw error

      await fetchOrders()
      await fetchAnalytics()
    } catch (error) {
      console.error("[v0] Error closing table:", error)
    }
  }

  const closeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", orderId)

      if (error) throw error

      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "completed" } : order)))
    } catch (error) {
      console.error("[v0] Error closing order:", error)
      alert("Failed to close order")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ready":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "ready":
        return <CheckCircle className="w-4 h-4" />
      case "completed":
        return <ChefHat className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusDisplayLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "ready":
        return "Confirmed"
      case "completed":
        return "Served"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")
    }
  }

  const handleAddItem = (type: "meal" | "drink") => {
    setItemType(type)
    setEditingItem(null)
    setShowAddModal(true)
  }

  const handleEditItem = (item: MenuItem, type: "meal" | "drink") => {
    setItemType(type)
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleDeleteItem = async (itemId: string, type: "meal" | "drink") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      const tableName = type === "meal" ? "meals" : "drinks"
      const { error } = await supabase.from(tableName).delete().eq("id", itemId)

      if (error) throw error

      // Refresh menu items
      fetchMenuItems()
    } catch (error) {
      console.error(`[v0] Error deleting ${type}:`, error)
      alert(`Error deleting ${type}. Please try again.`)
    }
  }

  const toggleAvailability = async (itemId: string, type: "meal" | "drink", currentStatus: string) => {
    try {
      const tableName = type === "meal" ? "meals" : "drinks"
      const newStatus = currentStatus === "available" ? "unavailable" : "available"

      const { error } = await supabase.from(tableName).update({ availability_status: newStatus }).eq("id", itemId)

      if (error) throw error

      // Refresh menu items
      fetchMenuItems()
    } catch (error) {
      console.error(`[v0] Error updating ${type} availability:`, error)
    }
  }

  const handleSaveItem = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingItem(null)
    fetchMenuItems()
  }

  const getItemPrice = (item: MenuItem) => {
    if (item.price) return formatCurrency(item.price)
    if (item.pricing) {
      const prices = Object.values(item.pricing).filter((p) => p !== null) as number[]
      if (prices.length > 0) {
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`
      }
    }
    return "No price set"
  }

  const resolveExtraNames = (extraIds: string[], restaurant: any) => {
    if (!extraIds) return []
    // The extraIds are actually the extra names themselves, not IDs
    return extraIds
  }

  const resolveSideNames = (sideIds: string[], restaurant: any) => {
    if (!sideIds) return []
    // The sideIds are actually the side names themselves, not IDs
    return sideIds
  }

  const ordersByTable = orders.reduce(
    (acc, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    },
    {} as Record<string, Order[]>,
  )

  const uniqueTables = [...new Set(orders.map((order) => order.table_number))].sort()
  const uniqueStatuses = [...new Set(orders.map((order) => order.status))]

  const filteredOrders = orders.filter((order) => {
    // First filter out closed tables from all tabs except closed-tables
    if (orderTab !== "closed-tables" && order.table_closed) return false

    // For closed-tables tab, only show closed tables
    if (orderTab === "closed-tables" && !order.table_closed) return false

    // Tab-based filtering by status (only for non-closed tables)
    if (orderTab === "open" && order.status !== "pending") return false
    if (orderTab === "confirmed" && order.status !== "ready") return false
    if (orderTab === "served" && order.status !== "completed") return false
    if (orderTab === "bill-requests" && !order.bill_requested) return false
    if (orderTab === "waiter-requests" && !order.waiter_called) return false

    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) return false

    // Table filter
    if (tableFilter !== "all" && order.table_number !== tableFilter) return false

    return true
  })

  console.log("[v0] Dashboard accessed with restaurantId:", restaurantId)
  console.log("[v0] Full params:", params)

  const addNotification = (type: "success" | "error" | "info", message: string) => {
    if (
      message.includes("New order") ||
      (message.includes("Bill request") && !message.includes("dismissed")) ||
      (message.includes("Waiter request") && !message.includes("dismissed"))
    ) {
      const newNotification = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
      }
      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)])

      playNotificationSound()
    }
  }

  const dismissRequest = async (orderId: string, type: "bill" | "waiter") => {
    try {
      const updateData = type === "bill" ? { bill_requested: false } : { waiter_called: false }

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

      if (error) throw error

      // Refresh orders
      fetchOrders()
      addNotification("success", `${type === "bill" ? "Bill" : "Waiter"} request dismissed`)
    } catch (error) {
      console.error(`Error dismissing ${type} request:`, error)
    }
  }

  const openOrdersCount = orders.filter((order) => order.status === "pending").length
  const billRequestsCount = orders.filter((order) => order.bill_requested).length
  const waiterRequestsCount = orders.filter((order) => order.waiter_called).length
  const closedTablesCount = orders.filter((order) => order.table_closed).length

  const billRequests = orders.filter((order) => order.bill_requested)
  const waiterRequests = orders.filter((order) => order.waiter_called)
  const closedTables = orders.filter((order) => order.table_closed)

  const openOrders = orders.filter((order) => order.status === "pending" && !order.table_closed)
  const confirmedOrders = orders.filter((order) => order.status === "ready" && !order.table_closed)
  const servedOrders = orders.filter((order) => order.status === "completed" && !order.table_closed)

  const groupedOpenOrders = openOrders.reduce((acc: any, order) => {
    const table = order.table_number.toString()
    if (!acc[table]) acc[table] = []
    acc[table].push(order)
    return acc
  }, {})

  const groupedConfirmedOrders = confirmedOrders.reduce((acc: any, order) => {
    const table = order.table_number.toString()
    if (!acc[table]) acc[table] = []
    acc[table].push(order)
    return acc
  }, {})

  const groupedServedOrders = servedOrders.reduce((acc: any, order) => {
    const table = order.table_number.toString()
    if (!acc[table]) acc[table] = []
    acc[table].push(order)
    return acc
  }, {})

  const groupedClosedTables = closedTables.reduce((acc: any, order) => {
    const table = order.table_number.toString()
    if (!acc[table]) acc[table] = []
    acc[table].push(order)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-xs text-gray-400 mt-2">Restaurant ID: {restaurantId}</p>
        </div>
      </div>
    )
  }

  if (!restaurant && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-600 mb-4">Restaurant ID: {restaurantId}</p>
          <p className="text-sm text-gray-500">Please check the URL and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Updated header to show restaurant name and logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {restaurant?.logo_url && (
                  <img
                    src={restaurant.logo_url || "/placeholder.svg"}
                    alt={`${restaurant.name} logo`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {restaurant?.name ? `${restaurant.name} Dashboard` : "Restaurant Dashboard"}
                </h1>
              </div>
            </div>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>

              {showNotificationCenter && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Notifications</h3>
                      <Button variant="ghost" size="sm" onClick={() => setNotifications([])}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <Tabs value={orderTab} onValueChange={setOrderTab} className="space-y-6 w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="border-b border-gray-200 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <nav className="flex space-x-8 w-full">
                        <button
                          onClick={() => setOrderTab("open")}
                          className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                            orderTab === "open"
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Open Orders
                          {openOrdersCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {openOrdersCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setOrderTab("confirmed")}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            orderTab === "confirmed"
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Confirmed Orders
                        </button>
                        <button
                          onClick={() => setOrderTab("served")}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            orderTab === "served"
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Served Orders
                        </button>
                        <button
                          onClick={() => setOrderTab("bill-requests")}
                          className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                            orderTab === "bill-requests"
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Bill Requests
                          {billRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {billRequestsCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setOrderTab("waiter-requests")}
                          className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                            orderTab === "waiter-requests"
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Waiter Requests
                          {waiterRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {waiterRequestsCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setOrderTab("closed-tables")}
                          className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                            orderTab === "closed-tables"
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Closed Tables
                          {closedTablesCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {closedTablesCount}
                            </span>
                          )}
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Statuses</option>
                        {uniqueStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                      <select
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Tables</option>
                        {uniqueTables.map((table) => (
                          <option key={table} value={table}>
                            Table {table}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("all")
                          setTableFilter("all")
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>

                {/* Open Orders Tab */}
                {orderTab === "open" && (
                  <div className="space-y-6">
                    {openOrders.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No open orders</h3>
                          <p className="text-gray-500">New orders will appear here when customers place them.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      Object.entries(groupedOpenOrders).map(([table, tableOrders]) => (
                        <div key={table} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <CardHeader className="pb-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <Users className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-xl">Table {table}</CardTitle>
                                  <p className="text-sm text-gray-600">{tableOrders.length} order(s)</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-orange-600">
                                  {formatCurrency(tableOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
                                </p>
                                <p className="text-xs text-gray-500">Running Total</p>
                                {!tableOrders[0]?.table_closed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => closeTable(table)}
                                    className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Close Table
                                  </Button>
                                )}
                                {tableOrders[0]?.table_closed && (
                                  <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                                    <X className="w-4 h-4 inline mr-1" />
                                    Table Closed
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {tableOrders.map((order) => (
                              <div key={order.id} className="border rounded-lg p-4 bg-white relative">
                                <LiveTimer createdAt={order.created_at} status={order.status} />

                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex flex-col space-y-2">
                                    <div className="text-lg font-bold text-gray-900">{order.diner_name}</div>
                                    <div className="flex items-center space-x-3">
                                      <Badge
                                        className={`${getStatusColor(order.status)} flex items-center space-x-1 border`}
                                      >
                                        {getStatusIcon(order.status)}
                                        <span>{getStatusDisplayLabel(order.status)}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  {/* </CHANGE> */}

                                  <div className="flex items-center space-x-2"></div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  {order.order_items?.map((item) => (
                                    <div key={item.id} className="space-y-1">
                                      {/* Main item */}
                                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                                        <div className="flex-1">
                                          <p className="font-medium">{item.item_name}</p>
                                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            {item.variant && <span>• {item.variant}</span>}
                                          </div>
                                          {item.preferences && Object.keys(item.preferences).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Preferences:{" "}
                                              {Object.entries(item.preferences)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(", ")}
                                            </div>
                                          )}
                                          {item.side_ids && item.side_ids.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                              Sides: {item.side_ids.join(", ")}
                                            </div>
                                          )}
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                                      </div>

                                      {item.extra_ids && item.extra_ids.length > 0 && (
                                        <div className="ml-4 space-y-1">
                                          {resolveExtraNames(item.extra_ids, restaurant).map((extraName, index) => (
                                            <div key={index} className="flex justify-between items-center py-1 text-sm">
                                              <div className="flex items-center space-x-2 text-gray-600">
                                                <span className="text-xs">+</span>
                                                <span>{item.extra_ids[index]}</span>
                                              </div>
                                              <span className="text-gray-500">Extra</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                  {orderTab === "open" && order.status === "pending" && (
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, "ready")}
                                      className="bg-blue-600 hover:bg-blue-700"
                                      size="sm"
                                    >
                                      Confirm Order
                                    </Button>
                                  )}
                                  {orderTab === "confirmed" && order.status === "ready" && (
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, "completed")}
                                      className="bg-green-600 hover:bg-green-700"
                                      size="sm"
                                    >
                                      Mark as Served
                                    </Button>
                                  )}
                                  {orderTab === "served" && order.status === "completed" && (
                                    <Button
                                      onClick={() => closeOrder(order.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      size="sm"
                                    >
                                      Close Order
                                    </Button>
                                  )}

                                  <div className="flex-1" />
                                  {order.bill_requested && (
                                    <Button
                                      onClick={() => dismissRequest(order.id, "bill")}
                                      variant="outline"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      Dismiss Bill Request
                                    </Button>
                                  )}
                                  {order.waiter_called && (
                                    <Button
                                      onClick={() => dismissRequest(order.id, "waiter")}
                                      variant="outline"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      Dismiss Waiter Request
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Confirmed Orders Tab */}
                {orderTab === "confirmed" && (
                  <div className="space-y-6">
                    {confirmedOrders.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No confirmed orders</h3>
                          <p className="text-gray-500">Orders that have been confirmed will appear here.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      Object.entries(groupedConfirmedOrders).map(([table, tableOrders]) => (
                        <div key={table} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <CardHeader className="pb-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <CheckCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-xl">Table {table}</CardTitle>
                                  <p className="text-sm text-gray-600">{tableOrders.length} order(s)</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(tableOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
                                </p>
                                <p className="text-xs text-gray-500">Running Total</p>
                                {!tableOrders[0]?.table_closed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => closeTable(table)}
                                    className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Close Table
                                  </Button>
                                )}
                                {tableOrders[0]?.table_closed && (
                                  <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                                    <X className="w-4 h-4 inline mr-1" />
                                    Table Closed
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {tableOrders.map((order) => (
                              <div key={order.id} className="border rounded-lg p-4 bg-white relative">
                                <LiveTimer createdAt={order.created_at} status={order.status} />

                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex flex-col space-y-2">
                                    <div className="text-lg font-bold text-gray-900">{order.diner_name}</div>
                                    <div className="flex items-center space-x-3">
                                      <Badge
                                        className={`${getStatusColor(order.status)} flex items-center space-x-1 border`}
                                      >
                                        {getStatusIcon(order.status)}
                                        <span>{getStatusDisplayLabel(order.status)}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  {/* </CHANGE> */}

                                  <div className="flex items-center space-x-2"></div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  {order.order_items?.map((item) => (
                                    <div key={item.id} className="space-y-1">
                                      {/* Main item */}
                                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                                        <div className="flex-1">
                                          <p className="font-medium">{item.item_name}</p>
                                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            {item.variant && <span>• {item.variant}</span>}
                                          </div>
                                          {item.preferences && Object.keys(item.preferences).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Preferences:{" "}
                                              {Object.entries(item.preferences)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(", ")}
                                            </div>
                                          )}
                                          {item.side_ids && item.side_ids.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                              Sides: {item.side_ids.join(", ")}
                                            </div>
                                          )}
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                                      </div>

                                      {item.extra_ids && item.extra_ids.length > 0 && (
                                        <div className="ml-4 space-y-1">
                                          {resolveExtraNames(item.extra_ids, restaurant).map((extraName, index) => (
                                            <div key={index} className="flex justify-between items-center py-1 text-sm">
                                              <div className="flex items-center space-x-2 text-gray-600">
                                                <span className="text-xs">+</span>
                                                <span>{item.extra_ids[index]}</span>
                                              </div>
                                              <span className="text-gray-500">Extra</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                  {orderTab === "open" && order.status === "pending" && (
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, "ready")}
                                      className="bg-blue-600 hover:bg-blue-700"
                                      size="sm"
                                    >
                                      Confirm Order
                                    </Button>
                                  )}
                                  {orderTab === "confirmed" && order.status === "ready" && (
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, "completed")}
                                      className="bg-green-600 hover:bg-green-700"
                                      size="sm"
                                    >
                                      Mark as Served
                                    </Button>
                                  )}
                                  {orderTab === "served" && order.status === "completed" && (
                                    <Button
                                      onClick={() => closeOrder(order.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      size="sm"
                                    >
                                      Close Order
                                    </Button>
                                  )}

                                  <div className="flex-1" />
                                  {order.bill_requested && (
                                    <Button
                                      onClick={() => dismissRequest(order.id, "bill")}
                                      variant="outline"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      Dismiss Bill Request
                                    </Button>
                                  )}
                                  {order.waiter_called && (
                                    <Button
                                      onClick={() => dismissRequest(order.id, "waiter")}
                                      variant="outline"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      Dismiss Waiter Request
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Served Orders Tab */}
                {orderTab === "served" && (
                  <div className="space-y-6">
                    {servedOrders.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No served orders</h3>
                          <p className="text-gray-500">Completed orders will appear here once they've been served.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      Object.entries(groupedServedOrders).map(([table, tableOrders]) => (
                        <div key={table} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <CardHeader className="pb-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <ChefHat className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-xl">Table {table}</CardTitle>
                                  <p className="text-sm text-gray-600">{tableOrders.length} order(s)</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  {formatCurrency(tableOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
                                </p>
                                <p className="text-xs text-gray-500">Running Total</p>
                                {!tableOrders[0]?.table_closed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => closeTable(table)}
                                    className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Close Table
                                  </Button>
                                )}
                                {tableOrders[0]?.table_closed && (
                                  <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                                    <X className="w-4 h-4 inline mr-1" />
                                    Table Closed
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {tableOrders.map((order) => (
                              <div key={order.id} className="border rounded-lg p-4 bg-white relative">
                                <LiveTimer createdAt={order.created_at} status={order.status} />

                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex flex-col space-y-2">
                                    <div className="text-lg font-bold text-gray-900">{order.diner_name}</div>
                                    <div className="flex items-center space-x-3">
                                      <Badge
                                        className={`${getStatusColor(order.status)} flex items-center space-x-1 border`}
                                      >
                                        {getStatusIcon(order.status)}
                                        <span>{getStatusDisplayLabel(order.status)}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  {/* </CHANGE> */}

                                  <div className="flex items-center space-x-2"></div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  {order.order_items?.map((item) => (
                                    <div key={item.id} className="space-y-1">
                                      {/* Main item */}
                                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                                        <div className="flex-1">
                                          <p className="font-medium">{item.item_name}</p>
                                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            {item.variant && <span>• {item.variant}</span>}
                                          </div>
                                          {item.preferences && Object.keys(item.preferences).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Preferences:{" "}
                                              {Object.entries(item.preferences)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(", ")}
                                            </div>
                                          )}
                                          {item.side_ids && item.side_ids.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                              Sides: {item.side_ids.join(", ")}
                                            </div>
                                          )}
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                                      </div>

                                      {item.extra_ids && item.extra_ids.length > 0 && (
                                        <div className="ml-4 space-y-1">
                                          {resolveExtraNames(item.extra_ids, restaurant).map((extraName, index) => (
                                            <div key={index} className="flex justify-between items-center py-1 text-sm">
                                              <div className="flex items-center space-x-2 text-gray-600">
                                                <span className="text-xs">+</span>
                                                <span>{item.extra_ids[index]}</span>
                                              </div>
                                              <span className="text-gray-500">Extra</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                  {orderTab === "open" && order.status === "pending" && (
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, "ready")}
                                      className="bg-blue-600 hover:bg-blue-700"
                                      size="sm"
                                    >
                                      Confirm Order
                                    </Button>
                                  )}
                                  {orderTab === "confirmed" && order.status === "ready" && (
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, "completed")}
                                      className="bg-green-600 hover:bg-green-700"
                                      size="sm"
                                    >
                                      Mark as Served
                                    </Button>
                                  )}

                                  <div className="flex-1" />
                                  {order.bill_requested && (
                                    <Button
                                      onClick={() => dismissRequest(order.id, "bill")}
                                      variant="outline"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      Dismiss Bill Request
                                    </Button>
                                  )}
                                  {order.waiter_called && (
                                    <Button
                                      onClick={() => dismissRequest(order.id, "waiter")}
                                      variant="outline"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      Dismiss Waiter Request
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Bill Requests Tab */}
                {orderTab === "bill-requests" && (
                  <div className="space-y-6">
                    {billRequests.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No bill requests</h3>
                          <p className="text-gray-500">Customer bill requests will appear here.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {billRequests.map((order) => (
                          <Card key={order.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle>Table {order.table_number}</CardTitle>
                                  <p className="text-sm text-gray-500">
                                    {order.diner_name} - {getTimeSinceOrder(order.created_at)}
                                  </p>
                                </div>
                                <Button onClick={() => dismissRequest(order.id, "bill")} variant="outline" size="sm">
                                  Dismiss Request
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Waiter Requests Tab */}
                {orderTab === "waiter-requests" && (
                  <div className="space-y-6">
                    {waiterRequests.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No waiter requests</h3>
                          <p className="text-gray-500">Customer waiter requests will appear here.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {waiterRequests.map((order) => (
                          <Card key={order.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle>Table {order.table_number}</CardTitle>
                                  <p className="text-sm text-gray-500">
                                    {order.diner_name} - {getTimeSinceOrder(order.created_at)}
                                  </p>
                                </div>
                                <Button onClick={() => dismissRequest(order.id, "waiter")} variant="outline" size="sm">
                                  Dismiss Request
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Closed Tables Tab */}
                {orderTab === "closed-tables" && (
                  <div className="space-y-6">
                    {closedTables.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <X className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No closed tables</h3>
                          <p className="text-gray-500">Tables that have been closed will appear here for tracking.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      Object.entries(groupedClosedTables).map(([table, tableOrders]) => (
                        <div key={table} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <CardHeader className="pb-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-gray-200 p-2 rounded-lg">
                                  <X className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-xl">Table {table}</CardTitle>
                                  <p className="text-sm text-gray-600">{tableOrders.length} order(s)</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-600">
                                  {formatCurrency(tableOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
                                </p>
                                <p className="text-xs text-gray-500">Total Revenue</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {tableOrders.map((order) => (
                              <div key={order.id} className="border rounded-lg p-4 bg-white relative">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex flex-col space-y-2">
                                    <div className="text-lg font-bold text-gray-900">{order.diner_name}</div>
                                    <div className="flex items-center space-x-3">
                                      <Badge
                                        className={`${getStatusColor(order.status)} flex items-center space-x-1 border`}
                                      >
                                        {getStatusIcon(order.status)}
                                        <span>{getStatusDisplayLabel(order.status)}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  {/* </CHANGE> */}

                                  <div className="flex items-center space-x-2"></div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  {order.order_items?.map((item) => (
                                    <div key={item.id} className="space-y-1">
                                      {/* Main item */}
                                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                                        <div className="flex-1">
                                          <p className="font-medium">{item.item_name}</p>
                                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            {item.variant && <span>• {item.variant}</span>}
                                          </div>
                                          {item.preferences && Object.keys(item.preferences).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Preferences:{" "}
                                              {Object.entries(item.preferences)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(", ")}
                                            </div>
                                          )}
                                          {item.side_ids && item.side_ids.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                              Sides: {item.side_ids.join(", ")}
                                            </div>
                                          )}
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                                      </div>

                                      {item.extra_ids && item.extra_ids.length > 0 && (
                                        <div className="ml-4 space-y-1">
                                          {resolveExtraNames(item.extra_ids, restaurant).map((extraName, index) => (
                                            <div key={index} className="flex justify-between items-center py-1 text-sm">
                                              <div className="flex items-center space-x-2 text-gray-600">
                                                <span className="text-xs">+</span>
                                                <span>{item.extra_ids[index]}</span>
                                              </div>
                                              <span className="text-gray-500">Extra</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Tabs>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Key Metrics Cards */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
                    <p className="text-xs text-muted-foreground">All time orders</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">All time revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics?.averageOrderValue || 0)}</div>
                    <p className="text-xs text-muted-foreground">Per order average</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Service Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.averageServiceTime || 0}m</div>
                    <p className="text-xs text-muted-foreground">From order to served</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status)}
                            <span>{getStatusDisplayLabel(status)}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.topItems.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Peak Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle>Peak Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.peakHours.map((hourData) => (
                        <div key={hourData.hour} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {hourData.hour}:00 - {hourData.hour + 1}:00
                            </span>
                          </div>
                          <span className="font-medium">{hourData.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="menu" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                <Button onClick={() => handleAddItem("meal")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Meal
                </Button>
                <Button onClick={() => handleAddItem("drink")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Drink
                </Button>
              </div>

              <Tabs value={menuTab} onValueChange={setMenuTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="meals">Meals</TabsTrigger>
                  <TabsTrigger value="drinks">Drinks</TabsTrigger>
                </TabsList>

                <TabsContent value="meals" className="space-y-4">
                  {meals.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Menu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No meals added yet</h3>
                        <p className="text-gray-500">Add your first meal to the menu.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {meals.map((meal) => (
                        <Card key={meal.id}>
                          <CardHeader>
                            <CardTitle>{meal.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm text-gray-500">{meal.description}</p>
                            <p className="text-lg font-semibold">{getItemPrice(meal)}</p>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditItem(meal, "meal")}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(meal.id, "meal")}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => toggleAvailability(meal.id, "meal", meal.availability_status)}
                              >
                                {meal.availability_status === "available" ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Unavailable
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Available
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="drinks" className="space-y-4">
                  {drinks.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Menu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No drinks added yet</h3>
                        <p className="text-gray-500">Add your first drink to the menu.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {drinks.map((drink) => (
                        <Card key={drink.id}>
                          <CardHeader>
                            <CardTitle>{drink.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm text-gray-500">{drink.description}</p>
                            <p className="text-lg font-semibold">{getItemPrice(drink)}</p>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditItem(drink, "drink")}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteItem(drink.id, "drink")}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => toggleAvailability(drink.id, "drink", drink.availability_status)}
                              >
                                {drink.availability_status === "available" ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Unavailable
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Available
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {itemType === "meal" ? "Meal" : "Drink"}</DialogTitle>
          </DialogHeader>
          <MenuItemForm
            restaurantId={restaurantId}
            type={itemType}
            onSave={handleSaveItem}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {itemType === "meal" ? "Meal" : "Drink"}</DialogTitle>
          </DialogHeader>
          <MenuItemForm
            restaurantId={restaurantId}
            type={itemType}
            item={editingItem}
            onSave={handleSaveItem}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LiveTimer({ createdAt, status }: { createdAt: string; status: string }) {
  const [timeElapsed, setTimeElapsed] = useState(getTimeSince(createdAt))

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeElapsed(getTimeSince(createdAt))
    }, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [createdAt])

  return (
    <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
      {status === "pending" ? `Open for ${timeElapsed}` : `Served ${timeElapsed} ago`}
    </div>
  )
}

function getTimeSince(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hours`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} days`
}

function getTimeSinceOrder(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} days ago`
}
