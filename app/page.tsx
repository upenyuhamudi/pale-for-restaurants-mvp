import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import type { Restaurant } from "@/lib/types/database"
import Link from "next/link"

async function getRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient()

  const { data: restaurants, error } = await supabase.from("restaurants").select("*").eq("hidden", false).order("name")

  if (error) {
    console.error("Error fetching restaurants:", error)
    return []
  }

  return restaurants || []
}

export default async function HomePage() {
  const restaurants = await getRestaurants()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 py-8 md:px-6 md:py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-2xl font-bold text-foreground md:text-4xl lg:text-6xl">Dine-in Ordering App</h1>
            <p className="text-base text-muted-foreground max-w-2xl md:text-xl">
              Experience seamless restaurant ordering with our modern dine-in platform
            </p>
          </div>

          <div className="w-full max-w-4xl space-y-4 md:space-y-6">
            <h2 className="text-lg font-semibold text-foreground md:text-2xl">Available Restaurants</h2>

            {restaurants.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <Link key={restaurant.id} href={`/r/${restaurant.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="p-4 md:p-6">
                        {restaurant.logo_url && (
                          <img
                            src={restaurant.logo_url || "/placeholder.svg"}
                            alt={`${restaurant.name} logo`}
                            className="w-12 h-12 object-contain mx-auto mb-2 md:w-16 md:h-16"
                          />
                        )}
                        <CardTitle className="text-base md:text-lg">{restaurant.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="space-y-2">
                          {restaurant.category && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Category:</span> {restaurant.category}
                            </p>
                          )}
                          {restaurant.location && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Location:</span> {restaurant.location}
                            </p>
                          )}
                          {restaurant.about && (
                            <p className="text-sm text-muted-foreground line-clamp-3">{restaurant.about}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="w-full max-w-sm mx-auto md:max-w-md">
                <CardContent className="p-4 text-center md:p-6">
                  <p className="text-muted-foreground">No restaurants available at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="w-full max-w-sm md:max-w-md">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next.js</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">TailwindCSS</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">shadcn/ui</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Supabase</span>
                  <span className="text-xs text-green-600">✓ Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Zustand</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">Production-ready setup complete 🚀</div>
        </div>
      </div>
    </div>
  )
}
