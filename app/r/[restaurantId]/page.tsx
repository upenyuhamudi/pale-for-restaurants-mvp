import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { RestaurantMenu } from "@/components/restaurant/restaurant-menu"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

interface RestaurantPageProps {
  params: {
    restaurantId: string
  }
}

function RestaurantLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <p className="text-muted-foreground">Loading restaurant menu...</p>
      </div>
    </div>
  )
}

async function RestaurantContent({ params }: RestaurantPageProps) {
  const supabase = await createServerClient()

  console.log("[v0] Fetching restaurant with ID:", params.restaurantId)

  // First, let's check what restaurants exist in the database
  const { data: allRestaurants, error: allRestaurantsError } = await supabase
    .from("restaurants")
    .select("id, name, hidden")

  console.log("[v0] All restaurants in database:", allRestaurants)
  console.log("[v0] Database query error:", allRestaurantsError)

  // Fetch restaurant data
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.restaurantId)
    .eq("hidden", false)
    .single()

  console.log("[v0] Restaurant query result:", restaurant)
  console.log("[v0] Restaurant query error:", restaurantError)

  if (restaurantError || !restaurant) {
    console.log("[v0] Restaurant not found, calling notFound()")
    notFound()
  }

  // Fetch categories for this restaurant
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", params.restaurantId)
    .order("name")

  // Fetch meals for this restaurant
  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("restaurant_id", params.restaurantId)
    .neq("availability_status", "hidden")
    .order("name")

  const { data: gameDayMeals } = await supabase
    .from("meals")
    .select("*")
    .eq("restaurant_id", params.restaurantId)
    .eq("game_day_menu", true)
    .neq("availability_status", "hidden")
    .order("name")

  // Fetch drinks for this restaurant
  const { data: drinks } = await supabase
    .from("drinks")
    .select("*")
    .eq("restaurant_id", params.restaurantId)
    .neq("availability_status", "hidden")
    .order("name")

  // Fetch specials for this restaurant
  const { data: specials } = await supabase
    .from("specials")
    .select("*")
    .eq("restaurant_id", params.restaurantId)
    .eq("availability_status", "available")
    .order("name")

  return (
    <div className="min-h-screen bg-background">
      <RestaurantMenu
        restaurant={restaurant}
        categories={categories || []}
        meals={meals || []}
        drinks={drinks || []}
        specials={specials || []}
        gameDayMeals={gameDayMeals || []}
      />
    </div>
  )
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  return (
    <Suspense fallback={<RestaurantLoading />}>
      <RestaurantContent params={params} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: RestaurantPageProps) {
  const supabase = await createServerClient()

  const { data: restaurant } = await supabase.from("restaurants").select("name").eq("id", params.restaurantId).single()

  return {
    title: restaurant?.name ? `${restaurant.name} - Menu` : "Restaurant Menu",
    description: `Browse the menu and place your order at ${restaurant?.name || "this restaurant"}`,
  }
}
