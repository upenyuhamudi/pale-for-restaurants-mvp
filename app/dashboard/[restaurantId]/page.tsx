"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
