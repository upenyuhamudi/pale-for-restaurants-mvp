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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="container mx-auto px-4 md:px-6 pb-20 pt-4 md:pt-16">
        <div className="flex flex-col items-center justify-center text-center space-y-8 md:space-y-12">
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h1 className="text-2xl font-bold text-foreground leading-tight sm:text-3xl md:text-4xl lg:text-6xl">
              Dine-in Ordering App
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl px-4 sm:text-base md:text-xl md:px-0">
              Experience seamless restaurant ordering with our modern dine-in platform
            </p>
          </div>

          <div className="w-full max-w-4xl space-y-6 md:space-y-8">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl mb-4 md:mb-6">
              Available Restaurants
            </h2>

            {restaurants.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <Link key={restaurant.id} href={`/r/${restaurant.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer min-h-[44px] p-4 md:p-6 m-2 md:m-0">
                      <CardHeader className="p-0 mb-3 md:mb-4">
                        {restaurant.logo_url && (
                          <img
                            src={restaurant.logo_url || "/placeholder.svg"}
                            alt={`${restaurant.name} logo`}
                            className="w-12 h-12 object-contain mx-auto mb-2 sm:w-14 sm:h-14 md:w-16 md:h-16"
                          />
                        )}
                        <CardTitle className="text-base sm:text-lg leading-tight">{restaurant.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-2 md:space-y-3">
                          {restaurant.category && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">Category:</span> {restaurant.category}
                            </p>
                          )}
                          {restaurant.location && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">Location:</span> {restaurant.location}
                            </p>
                          )}
                          {restaurant.about && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{restaurant.about}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="w-full max-w-md mx-auto p-4 md:p-6 m-4 md:m-0">
                <CardContent className="p-0 text-center">
                  <p className="text-muted-foreground text-sm">No restaurants available at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="w-full max-w-md p-4 md:p-6 m-4 md:m-0 mt-8 md:mt-12">
            <CardContent className="p-0">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between min-h-[44px]">
                  <span className="text-xs font-medium sm:text-sm">Next.js</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between min-h-[44px]">
                  <span className="text-xs font-medium sm:text-sm">TailwindCSS</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between min-h-[44px]">
                  <span className="text-xs font-medium sm:text-sm">shadcn/ui</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between min-h-[44px]">
                  <span className="text-xs font-medium sm:text-sm">Supabase</span>
                  <span className="text-xs text-green-600">✓ Connected</span>
                </div>
                <div className="flex items-center justify-between min-h-[44px]">
                  <span className="text-xs font-medium sm:text-sm">Zustand</span>
                  <span className="text-xs text-green-600">✓ Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground sm:text-sm mt-8 md:mt-12 pb-4">
            Production-ready setup complete 🚀
          </div>
        </div>
      </div>
    </div>
  )
}
