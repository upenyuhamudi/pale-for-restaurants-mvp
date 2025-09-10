import { createClient } from "@/lib/supabase/client"

interface ViewEvent {
  restaurant_id: string
  item_id?: string
  item_name?: string
  item_type?: "meal" | "drink"
  category_id?: string
  category_name?: string
  event_type: "item_view" | "category_view"
  table_number?: string
  diner_name?: string
}

export class Analytics {
  private static supabase = createClient()

  static async getTopSellingDrinks(restaurantId: string, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from("order_items")
        .select("item_id, item_name, quantity")
        .eq("item_type", "drink")
        .in(
          "order_id",
          await this.supabase
            .from("orders")
            .select("id")
            .eq("restaurant_id", restaurantId)
            .then(({ data }) => data?.map((order) => order.id) || []),
        )

      if (error) throw error

      // Aggregate the data in JavaScript
      const drinkCounts = new Map<string, { item_id: string; item_name: string; total_quantity: number }>()

      data?.forEach((item) => {
        const key = item.item_id
        if (drinkCounts.has(key)) {
          const existing = drinkCounts.get(key)!
          existing.total_quantity += item.quantity
        } else {
          drinkCounts.set(key, {
            item_id: item.item_id,
            item_name: item.item_name,
            total_quantity: item.quantity,
          })
        }
      })

      // Sort by total quantity ordered and return top drinks
      return Array.from(drinkCounts.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit)
    } catch (error) {
      console.error("[v0] Error fetching top selling drinks:", error)
      return []
    }
  }

  static async getTopSellingMeals(restaurantId: string, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from("order_items")
        .select("item_id, item_name, quantity")
        .eq("item_type", "meal")
        .in(
          "order_id",
          await this.supabase
            .from("orders")
            .select("id")
            .eq("restaurant_id", restaurantId)
            .then(({ data }) => data?.map((order) => order.id) || []),
        )

      if (error) throw error

      // Aggregate the data in JavaScript
      const mealCounts = new Map<string, { item_id: string; item_name: string; total_quantity: number }>()

      data?.forEach((item) => {
        const key = item.item_id
        if (mealCounts.has(key)) {
          const existing = mealCounts.get(key)!
          existing.total_quantity += item.quantity
        } else {
          mealCounts.set(key, {
            item_id: item.item_id,
            item_name: item.item_name,
            total_quantity: item.quantity,
          })
        }
      })

      // Sort by total quantity ordered and return top meals
      return Array.from(mealCounts.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit)
    } catch (error) {
      console.error("[v0] Error fetching top selling meals:", error)
      return []
    }
  }
}
