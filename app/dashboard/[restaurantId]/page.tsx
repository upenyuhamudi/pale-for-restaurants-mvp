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
  Search,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { MenuItemForm } from "@/components/dashboard/menu-item-form"
import { Analytics as AnalyticsLib } from "@/lib/analytics"
import { WaiterNameModal } from "@/components/dashboard/waiter-name-modal"
import { NotificationBar } from "@/components/dashboard/notification-bar"
import { Input } from "@/components/ui/input"
import { SpecialForm } from "@/components/dashboard/special-form"

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
  waiter_name?: string
  service_time_minutes?: number
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
  category_id: string
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
  extras_allowed?: boolean
  allowed_extras?: number
  requires_doneness?: boolean
  preferences?: Record<string, any>
}

interface Analytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  averageServiceTime: number
  ordersByStatus: { status: string; count: number }[]
  topItems: Array<{ item_name: string; total_quantity: number }>
  peakHours: Array<{ hour: number; order_count: number }>
  topSellingDrinks: Array<{ item_name: string; total_quantity: number }>
  topSellingMeals: Array<{ item_name: string; total_quantity: number }>
}

interface Category {
  id: string
  name: string
}

interface Special {
  id: string
  name: string
  description: string
  image_url?: string
  restaurant_id: string
  category: string
  availability_status: string
  special_type: string
  original_price: any
  special_price: any
  discount_percentage?: number
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  days_of_week?: any
  max_redemptions?: number
  current_redemptions?: number
  is_featured: boolean
  terms_and_conditions?: string
  ingredients?: any
  allergens?: any
  dietary_preferences?: any
  created_at: string
  updated_at: string
}

export default function RestaurantDashboard() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [meals, setMeals] = useState<MenuItem[]>([])
  const [drinks, setDrinks] = useState<MenuItem[]>([])
  const [specials, setSpecials] = useState<Special[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeSection, setActiveSection] = useState<"orders" | "menu" | "analytics">("orders")
  const [menuTab, setMenuTab] = useState("meals")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemType, setItemType] = useState<"meal" | "drink">("meal")
  const [editingSpecial, setEditingSpecial] = useState<Special | null>(null)
  const [showAddSpecialModal, setShowAddSpecialModal] = useState(false)
  const [showEditSpecialModal, setShowEditSpecialModal] = useState(false)

  const [orderTab, setOrderTab] = useState("open")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tableFilter, setTableFilter] = useState<string>("all")

  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string; timestamp: string }>
  >([])
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)

  const [activeTab, setActiveTab] = useState("orders")

  const [showWaiterModal, setShowWaiterModal] = useState(false)
  const [pendingOrderConfirmation, setPendingOrderConfirmation] = useState<{
    id: string
    dinerName: string
    tableNumber: string
  } | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>("all")
  const [selectedDrinkCategory, setSelectedDrinkCategory] = useState<string>("all")

  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [mealFeatureFilter, setMealFeatureFilter] = useState<string>("all")
  const [drinkFeatureFilter, setDrinkFeatureFilter] = useState<string>("all")

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
          meals:meals(id, name, side_choices, extra_choices, category_id)
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
      const [mealsResponse, drinksResponse, specialsResponse] = await Promise.all([
        supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name"),
        supabase.from("drinks").select("*").eq("restaurant_id", restaurantId).order("name"),
        supabase.from("specials").select("*").eq("restaurant_id", restaurantId).order("name"),
      ])

      if (mealsResponse.error) throw mealsResponse.error
      if (drinksResponse.error) throw drinksResponse.error
      if (specialsResponse.error) throw specialsResponse.error

      setMeals(mealsResponse.data || [])
      setDrinks(drinksResponse.data || [])
      setSpecials(specialsResponse.data || [])
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
          const status = order.status
          const existing = acc.find((item) => item.status === status)
          if (existing) {
            existing.count += 1
          } else {
            acc.push({ status: status, count: 1 })
          }
          return acc
        },
        [] as { status: string; count: number }[],
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
        .map(([name, data]) => ({ item_name: name, total_quantity: data.count }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5)

      const hourCounts = new Map<number, number>()
      orders.forEach((order) => {
        const hour = new Date(order.created_at).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      })

      const peakHours = Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour: hour, order_count: count }))
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 6)

      const [topSellingDrinks, topSellingMeals] = await Promise.all([
        AnalyticsLib.getTopSellingDrinks(restaurantId, 5),
        AnalyticsLib.getTopSellingMeals(restaurantId, 5),
      ])

      setAnalytics({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        averageServiceTime,
        ordersByStatus,
        topItems,
        peakHours,
        topSellingDrinks,
        topSellingMeals,
      })
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    }
  }

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "ready" | "completed",
    waiterName?: string,
  ) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === "ready" && waiterName) {
        updateData.waiter_name = waiterName
      }

      if (newStatus === "completed") {
        const order = orders.find((o) => o.id === orderId)
        if (order) {
          const createdAt = new Date(order.created_at)
          const now = new Date()
          const serviceTimeMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
          updateData.service_time_minutes = serviceTimeMinutes
        }
      }

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

      if (error) throw error

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...(waiterName && { waiter_name: waiterName }),
                ...(newStatus === "completed" &&
                  updateData.service_time_minutes && { service_time_minutes: updateData.service_time_minutes }),
              }
            : order,
        ),
      )
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const handleConfirmOrder = (order: Order) => {
    if (order.table_closed) {
      alert("Cannot confirm orders for closed tables")
      return
    }

    // If the table already has a waiter assigned (from previous orders), use that waiter
    const existingWaiter = orders.find(
      (o) => o.table_number === order.table_number && o.waiter_name && !o.table_closed,
    )?.waiter_name

    if (existingWaiter) {
      // Skip waiter modal and directly confirm with existing waiter
      updateOrderStatus(order.id, "ready", existingWaiter)
    } else {
      // Show waiter modal for new table assignment
      setPendingOrderConfirmation({
        id: order.id,
        dinerName: order.diner_name,
        tableNumber: order.table_number.toString(),
      })
      setShowWaiterModal(true)
    }
  }

  const confirmOrderWithWaiter = async (waiterName: string) => {
    if (!pendingOrderConfirmation) return

    await updateOrderStatus(pendingOrderConfirmation.id, "ready", waiterName)
    setPendingOrderConfirmation(null)
  }

  const closeWaiterModal = () => {
    setShowWaiterModal(false)
    setPendingOrderConfirmation(null)
  }

  const closeTable = async (tableNumber: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ table_closed: true })
        .eq("table_number", tableNumber)
        .eq("restaurant_id", restaurantId)

      if (error) throw error

      setOrders((prev) =>
        prev.map((order) => (order.table_number === tableNumber ? { ...order, table_closed: true } : order)),
      )
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

  const resolveSideNames = (sideIds: string[], restaurant: any) => {
    if (!sideIds || !restaurant?.meals) return []

    return sideIds.map((id) => {
      // Find the meal by ID and return its name
      const meal = restaurant.meals.find((meal: any) => meal.id === id)
      return meal ? meal.name : id
    })
  }

  const resolveExtraNames = (extraIds: string[], restaurant: any) => {
    if (!extraIds || !restaurant?.meals) return []

    return extraIds.map((id) => {
      // Find the meal by ID and return its name
      const meal = restaurant.meals.find((meal: any) => meal.id === id)
      return meal ? meal.name : id
    })
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

    if (tableFilter !== "all" && order.table_number.toString() !== tableFilter) return false

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

  const groupedOpenOrders = filteredOrders
    .filter((order) => order.status === "pending")
    .reduce((acc: any, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    }, {})

  const groupedConfirmedOrders = filteredOrders
    .filter((order) => order.status === "ready")
    .sort((a, b) => {
      // Sort by created_at ascending (oldest orders first, which means longest wait time)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    .reduce((acc: any, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    }, {})

  const groupedServedOrders = filteredOrders
    .filter((order) => order.status === "completed")
    .reduce((acc: any, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    }, {})

  const groupedClosedTables = filteredOrders
    .filter((order) => order.table_closed)
    .reduce((acc: any, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    }, {})

  const groupedBillRequests = filteredOrders
    .filter((order) => order.bill_requested)
    .reduce((acc: any, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    }, {})

  const groupedWaiterRequests = filteredOrders
    .filter((order) => order.waiter_called)
    .reduce((acc: any, order) => {
      const table = order.table_number.toString()
      if (!acc[table]) acc[table] = []
      acc[table].push(order)
      return acc
    }, {})

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
    }
  }

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name")

      if (error) throw error
      setMeals(data || [])
    } catch (error) {
      console.error("[v0] Error fetching meals:", error)
    }
  }

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase.from("drinks").select("*").eq("restaurant_id", restaurantId).order("name")

      if (error) throw error
      setDrinks(data || [])
    } catch (error) {
      console.error("[v0] Error fetching drinks:", error)
    }
  }

  const fetchSpecials = async () => {
    try {
      const { data, error } = await supabase
        .from("specials")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name")

      if (error) throw error
      setSpecials(data || [])
    } catch (error) {
      console.error("[v0] Error fetching specials:", error)
    }
  }

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant()
      fetchOrders()
      fetchMeals()
      fetchDrinks()
      fetchCategories() // Added fetchCategories call
      fetchAnalytics()
    }
  }, [restaurantId])

  useEffect(() => {
    if (!restaurantId) return

    const refreshInterval = setInterval(() => {
      console.log("[v0] Background refresh triggered")
      fetchOrders()
      fetchMeals()
      fetchDrinks()
      fetchSpecials()
      fetchAnalytics()
    }, 5000) // Refresh every 5 seconds

    return () => {
      clearInterval(refreshInterval)
    }
  }, [restaurantId])

  const getMealCategories = () => {
    const mealCategoryIds = [...new Set(meals.map((meal) => meal.category_id).filter(Boolean))]
    return categories.filter((category) => mealCategoryIds.includes(category.id))
  }

  const getDrinkCategories = () => {
    const drinkCategoryIds = [...new Set(drinks.map((drink) => drink.category_id).filter(Boolean))]
    return categories.filter((category) => drinkCategoryIds.includes(category.id))
  }

  const getFilteredMeals = () => {
    let filtered = meals

    // Filter by category
    if (selectedMealCategory !== "all") {
      filtered = filtered.filter((meal) => meal.category_id === selectedMealCategory)
    }

    if (mealFeatureFilter !== "all") {
      filtered = filtered.filter((meal) => {
        switch (mealFeatureFilter) {
          case "extras":
            return meal.extras_allowed || (meal.allowed_extras && meal.allowed_extras > 0)
          case "sides":
            return meal.allowed_sides && meal.allowed_sides > 0
          case "preferences":
            return meal.preferences && Array.isArray(meal.preferences) && meal.preferences.length > 0
          default:
            return true
        }
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((meal) => {
        const categoryName = getCategoryName(meal.category_id || "").toLowerCase()
        return (
          meal.name.toLowerCase().includes(query) ||
          meal.description?.toLowerCase().includes(query) ||
          categoryName.includes(query)
        )
      })
    }

    return filtered
  }

  const getFilteredDrinks = () => {
    let filtered = drinks

    // Filter by category
    if (selectedDrinkCategory !== "all") {
      filtered = filtered.filter((drink) => drink.category_id === selectedDrinkCategory)
    }

    if (drinkFeatureFilter !== "all") {
      filtered = filtered.filter((drink) => {
        switch (drinkFeatureFilter) {
          case "extras":
            return drink.extras_allowed || (drink.allowed_extras && drink.allowed_extras > 0)
          case "sides":
            return drink.allowed_sides && drink.allowed_sides > 0
          case "preferences":
            return drink.preferences && Array.isArray(drink.preferences) && meals.preferences.length > 0
          default:
            return true
        }
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((drink) => {
        const categoryName = getCategoryName(drink.category_id || "").toLowerCase()
        return (
          drink.name.toLowerCase().includes(query) ||
          drink.description?.toLowerCase().includes(query) ||
          categoryName.includes(query)
        )
      })
    }

    return filtered
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category?.name || "Uncategorized"
  }

  const handleAddSpecial = () => {
    setEditingSpecial(null)
    setShowAddSpecialModal(true)
  }

  const handleEditSpecial = (special: Special) => {
    setEditingSpecial(special)
    setShowEditSpecialModal(true)
  }

  const handleDeleteSpecial = async (specialId: string) => {
    try {
      const { error } = await supabase.from("specials").delete().eq("id", specialId)
      if (error) throw error
      await fetchMenuItems()
    } catch (error) {
      console.error("[v0] Error deleting special:", error)
    }
  }

  const toggleSpecialAvailability = async (specialId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "available" ? "unavailable" : "available"
      const { error } = await supabase.from("specials").update({ availability_status: newStatus }).eq("id", specialId)
      if (error) throw error
      await fetchMenuItems()
    } catch (error) {
      console.error("[v0] Error updating special availability:", error)
    }
  }

  const handleSaveSpecial = () => {
    setShowAddSpecialModal(false)
    setShowEditSpecialModal(false)
    setEditingSpecial(null)
    fetchMenuItems()
  }

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
          <NotificationBar restaurantId={restaurantId} />

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
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {tableOrders[0]?.waiter_name && (
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      Waiter: {tableOrders[0].waiter_name}
                                    </p>
                                  )}
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
                                <OrderTimer
                                  createdAt={order.created_at}
                                  status={order.status}
                                  serviceTimeMinutes={order.service_time_minutes}
                                />

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
                                              Sides: {resolveSideNames(item.side_ids, restaurant).join(", ")}
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
                                                <span>{extraName}</span>
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
                                      onClick={() => handleConfirmOrder(order)}
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
                                  {tableOrders[0]?.waiter_name && (
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      Waiter: {tableOrders[0].waiter_name}
                                    </p>
                                  )}
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
                                <OrderTimer
                                  createdAt={order.created_at}
                                  status={order.status}
                                  serviceTimeMinutes={order.service_time_minutes}
                                />

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
                                              Sides: {resolveSideNames(item.side_ids, restaurant).join(", ")}
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
                                                <span>{extraName}</span>
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
                                      onClick={() => handleConfirmOrder(order)}
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
                                  {tableOrders[0]?.waiter_name && (
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      Waiter: {tableOrders[0].waiter_name}
                                    </p>
                                  )}
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
                                <OrderTimer
                                  createdAt={order.created_at}
                                  status={order.status}
                                  serviceTimeMinutes={order.service_time_minutes}
                                />

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
                                              Sides: {resolveSideNames(item.side_ids, restaurant).join(", ")}
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
                                                <span>{extraName}</span>
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
                                      onClick={() => handleConfirmOrder(order)}
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
                        {billRequests.map((order) => {
                          const tableOrders = orders.filter(
                            (o) => o.table_number === order.table_number && !o.table_closed,
                          )
                          const totalItems = tableOrders.reduce(
                            (sum, o) =>
                              sum + (o.order_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
                            0,
                          )
                          const servedItems = tableOrders
                            .filter((o) => o.status === "completed")
                            .reduce(
                              (sum, o) =>
                                sum + (o.order_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
                              0,
                            )
                          const runningTotal = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0)

                          return (
                            <Card key={order.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {order.waiter_name && (
                                      <p className="text-sm text-gray-700 mb-2 font-semibold">
                                        Waiter: {order.waiter_name}
                                      </p>
                                    )}
                                    <CardTitle className="mb-2">Table {order.table_number}</CardTitle>
                                    <p className="text-sm text-gray-500 mb-3">
                                      {order.diner_name} - {getTimeSinceOrder(order.created_at)}
                                    </p>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                      <h4 className="font-medium text-gray-900 mb-2">Bill Summary</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-600">Items Ordered:</p>
                                          <p className="font-medium">{totalItems}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Items Served:</p>
                                          <p className="font-medium">{servedItems}</p>
                                        </div>
                                      </div>
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                          <p className="text-gray-600">Running Total:</p>
                                          <p className="text-lg font-bold text-green-600">
                                            {formatCurrency(runningTotal)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    onClick={() => dismissRequest(order.id, "bill")}
                                    variant="outline"
                                    size="sm"
                                    className="ml-4"
                                  >
                                    Dismiss Request
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
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
                                  {order.waiter_name && (
                                    <p className="text-sm font-medium text-gray-700 mb-1 py-5">
                                      Waiter: {order.waiter_name}
                                    </p>
                                  )}
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
                                              Sides: {resolveSideNames(item.side_ids, restaurant).join(", ")}
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
                                                <span>{extraName}</span>
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
              {analytics ? (
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

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Top Selling Drinks (Top 5)</CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.topSellingDrinks.length > 0 ? (
                          analytics.topSellingDrinks.map((drink, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="truncate">{drink.item_name}</span>
                              <span className="font-medium text-blue-600">{drink.total_quantity} sold</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No sales data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Top Selling Meals (Top 5)</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.topSellingMeals.length > 0 ? (
                          analytics.topSellingMeals.map((meal, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="truncate">{meal.item_name}</span>
                              <span className="font-medium text-orange-600">{meal.total_quantity} sold</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No sales data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* ... existing analytics cards continue ... */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="menu" className="space-y-6">
              {/* Menu Management Section - existing code with minor updates */}
              <Tabs value={menuTab} onValueChange={setMenuTab} className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Menu Management</h2>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleAddItem("meal")} className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Meal
                      </Button>
                      <Button onClick={() => handleAddItem("drink")} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Drink
                      </Button>
                      <Button onClick={handleAddSpecial} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Special
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search meals, drinks, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <TabsList>
                    <TabsTrigger value="meals">Meals ({getFilteredMeals().length})</TabsTrigger>
                    <TabsTrigger value="drinks">Drinks ({getFilteredDrinks().length})</TabsTrigger>
                    <TabsTrigger value="specials">Specials ({specials.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="meals">
                    <div className="border-b mb-4 space-y-3">
                      {/* Category Filter */}
                      <div className="flex space-x-1 overflow-x-auto pb-2">
                        <Button
                          variant={selectedMealCategory === "all" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedMealCategory("all")}
                          className="whitespace-nowrap"
                        >
                          All Categories
                        </Button>
                        {getMealCategories().map((category) => (
                          <Button
                            key={category.id}
                            variant={selectedMealCategory === category.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedMealCategory(category.id)}
                            className="whitespace-nowrap"
                          >
                            {category.name}
                          </Button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge
                          variant={mealFeatureFilter === "all" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors px-3 py-1"
                          onClick={() => setMealFeatureFilter("all")}
                        >
                          All Features
                        </Badge>
                        <Badge
                          variant={mealFeatureFilter === "extras" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors px-3 py-1"
                          onClick={() => setMealFeatureFilter("extras")}
                        >
                          With Extras (
                          {meals.filter((m) => m.extras_allowed || (m.allowed_extras && m.allowed_extras > 0)).length})
                        </Badge>
                        <Badge
                          variant={mealFeatureFilter === "sides" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors px-3 py-1"
                          onClick={() => setMealFeatureFilter("sides")}
                        >
                          With Sides ({meals.filter((m) => m.allowed_sides && m.allowed_sides > 0).length})
                        </Badge>
                        <Badge
                          variant={mealFeatureFilter === "preferences" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors px-3 py-1"
                          onClick={() => setMealFeatureFilter("preferences")}
                        >
                          Requires Preferences ({meals.filter((m) => m.preferences && m.preferences.length > 0).length})
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {getFilteredMeals().map((meal) => (
                        <Card key={meal.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {meal.image_url && (
                                  <img
                                    src={meal.image_url || "/placeholder.svg"}
                                    alt={meal.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold">{meal.name}</h3>
                                    <Badge
                                      variant={meal.availability_status === "available" ? "default" : "secondary"}
                                      className={
                                        meal.availability_status === "available" ? "bg-green-100 text-green-800" : ""
                                      }
                                    >
                                      {meal.availability_status}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {getCategoryName(meal.category_id || "")}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span className="font-medium text-orange-600">{getItemPrice(meal)}</span>
                                    {meal.dietary_category && <span>• {meal.dietary_category}</span>}
                                    {meal.allowed_sides > 0 && <span>• {meal.allowed_sides} sides allowed</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAvailability(meal.id, "meal", meal.availability_status)}
                                >
                                  {meal.availability_status === "available" ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditItem(meal, "meal")}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteItem(meal.id, "meal")}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {getFilteredMeals().length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {searchQuery.trim()
                            ? `No meals found matching "${searchQuery}".`
                            : selectedMealCategory === "all" && mealFeatureFilter === "all"
                              ? "No meals found. Add your first meal to get started."
                              : `No meals found matching the selected filters.`}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="drinks" className="space-y-4">
                    <div className="border-b mb-4">
                      <div className="flex space-x-1 overflow-x-auto pb-2">
                        <Button
                          variant={selectedDrinkCategory === "all" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedDrinkCategory("all")}
                          className="whitespace-nowrap"
                        >
                          All Categories
                        </Button>
                        {getDrinkCategories().map((category) => (
                          <Button
                            key={category.id}
                            variant={selectedDrinkCategory === category.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedDrinkCategory(category.id)}
                            className="whitespace-nowrap"
                          >
                            {category.name}
                          </Button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge
                          variant={drinkFeatureFilter === "all" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors px-3 py-1"
                          onClick={() => setDrinkFeatureFilter("all")}
                        >
                          All Features
                        </Badge>
                        <Badge
                          variant={drinkFeatureFilter === "extras" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors px-3 py-1"
                          onClick={() => setDrinkFeatureFilter("extras")}
                        >
                          With Extras (
                          {drinks.filter((d) => d.extras_allowed || (d.allowed_extras && d.allowed_extras > 0)).length})
                        </Badge>
                        <Badge
                          variant={drinkFeatureFilter === "sides" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors px-3 py-1"
                          onClick={() => setDrinkFeatureFilter("sides")}
                        >
                          With Sides ({drinks.filter((d) => d.allowed_sides && d.allowed_sides > 0).length})
                        </Badge>
                        <Badge
                          variant={drinkFeatureFilter === "preferences" ? "default" : "outline"}
                          className="cursor-pointer hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors px-3 py-1"
                          onClick={() => setDrinkFeatureFilter("preferences")}
                        >
                          Requires Preferences ({drinks.filter((d) => d.preferences && d.preferences.length > 0).length}
                          )
                        </Badge>
                      </div>
                    </div>

                    {getFilteredDrinks().map((drink) => (
                      <Card key={drink.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {drink.image_url && (
                                <img
                                  src={drink.image_url || "/placeholder.svg"}
                                  alt={drink.name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold">{drink.name}</h3>
                                  <Badge
                                    variant={drink.availability_status === "available" ? "default" : "secondary"}
                                    className={
                                      drink.availability_status === "available" ? "bg-green-100 text-green-800" : ""
                                    }
                                  >
                                    {drink.availability_status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {getCategoryName(drink.category_id || "")}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{drink.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  <span className="font-medium text-blue-600">{getItemPrice(drink)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAvailability(drink.id, "drink", drink.availability_status)}
                              >
                                {drink.availability_status === "available" ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditItem(drink, "drink")}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(drink.id, "drink")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {getFilteredDrinks().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery.trim()
                          ? `No drinks found matching "${searchQuery}".`
                          : selectedDrinkCategory === "all"
                            ? "No drinks found. Add your first drink to get started."
                            : `No drinks found in ${getDrinkCategories().find((c) => c.id === selectedDrinkCategory)?.name || "this category"}.`}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="specials" className="space-y-4">
                    <div className="space-y-4">
                      {specials.map((special) => (
                        <Card key={special.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {special.image_url && (
                                  <img
                                    src={special.image_url || "/placeholder.svg"}
                                    alt={special.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold">{special.name}</h3>
                                    <Badge
                                      variant={special.availability_status === "available" ? "default" : "secondary"}
                                      className={
                                        special.availability_status === "available" ? "bg-green-100 text-green-800" : ""
                                      }
                                    >
                                      {special.availability_status}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {special.special_type}
                                    </Badge>
                                    {special.is_featured && (
                                      <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{special.description}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span className="font-medium text-purple-600">
                                      {special.special_price ? formatCurrency(special.special_price) : "N/A"}
                                    </span>
                                    {special.original_price && (
                                      <span className="line-through text-gray-400">
                                        {formatCurrency(special.original_price)}
                                      </span>
                                    )}
                                    {special.discount_percentage && (
                                      <span className="text-green-600 font-medium">
                                        {special.discount_percentage}% off
                                      </span>
                                    )}
                                    <span>
                                      • {special.start_date} to {special.end_date}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleSpecialAvailability(special.id, special.availability_status)}
                                >
                                  {special.availability_status === "available" ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditSpecial(special)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSpecial(special.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {specials.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No specials found. Add your first special to get started.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>

        {activeSection === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">{analytics?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Receipt className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Order</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(analytics?.averageOrderValue || 0)}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Tables</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {
                          Object.keys(ordersByTable).filter((table) =>
                            ordersByTable[table].some((order: any) => !order.table_closed),
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Items */}
            {/* Top Selling Drinks */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Drinks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topSellingDrinks.length > 0 ? (
                    analytics.topSellingDrinks.map((drink, index) => (
                      <div
                        key={drink.item_name}
                        className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{drink.item_name}</p>
                            <p className="text-sm text-gray-600">{drink.total_quantity} orders</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No drink orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Meals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topSellingMeals.length > 0 ? (
                    analytics.topSellingMeals.map((meal, index) => (
                      <div
                        key={meal.item_name}
                        className="flex items-center justify-between p-4 bg-orange-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{meal.item_name}</p>
                            <p className="text-sm text-gray-600">{meal.total_quantity} orders</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No meal orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New {itemType === "meal" ? "Meal" : "Drink"}</DialogTitle>
            </DialogHeader>
            <MenuItemForm
              restaurantId={restaurantId}
              itemType={itemType}
              onSave={handleSaveItem}
              onCancel={() => setShowAddModal(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {itemType === "meal" ? "Meal" : "Drink"}</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <MenuItemForm
                restaurantId={restaurantId}
                itemType={itemType}
                item={editingItem}
                onSave={handleSaveItem}
                onCancel={() => setShowEditModal(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showAddSpecialModal} onOpenChange={setShowAddSpecialModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Special</DialogTitle>
            </DialogHeader>
            <SpecialForm
              restaurantId={restaurantId}
              onSave={handleSaveSpecial}
              onCancel={() => setShowAddSpecialModal(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showEditSpecialModal} onOpenChange={setShowEditSpecialModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Special</DialogTitle>
            </DialogHeader>
            {editingSpecial && (
              <SpecialForm
                restaurantId={restaurantId}
                special={editingSpecial}
                onSave={handleSaveSpecial}
                onCancel={() => setShowEditSpecialModal(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>

      <WaiterNameModal
        isOpen={showWaiterModal}
        onClose={closeWaiterModal}
        onConfirm={confirmOrderWithWaiter}
        orderDetails={pendingOrderConfirmation}
      />
    </div>
  )
}

function OrderTimer({
  createdAt,
  status,
  serviceTimeMinutes,
}: {
  createdAt: string
  status: "pending" | "ready" | "completed"
  serviceTimeMinutes?: number
}) {
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (status === "completed") {
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const orderTime = new Date(createdAt)
      const diffInSeconds = Math.floor((now.getTime() - orderTime.getTime()) / 1000)
      setTimeElapsed(diffInSeconds)
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [createdAt, status])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins}m`
  }

  if (status === "completed") {
    return (
      <div className="absolute top-2 right-2 text-green-600 font-bold text-lg">
        Served in: {serviceTimeMinutes ? formatMinutes(serviceTimeMinutes) : "N/A"}
      </div>
    )
  }

  return <div className="absolute top-2 right-2 text-red-600 font-bold text-lg">{formatTime(timeElapsed)}</div>
}

function getTimeSinceOrder(createdAt: string) {
  const now = new Date()
  const orderTime = new Date(createdAt)
  const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else {
    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    return `${hours}h ${minutes}m ago`
  }
}
