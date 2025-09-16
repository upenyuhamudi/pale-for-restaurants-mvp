"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs"
import { MenuItemCard } from "@/components/restaurant/menu-item-card"
import { SpecialCard } from "@/components/restaurant/special-card" // Import SpecialCard component
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCartStore } from "@/store/cart"

interface Category {
  id: string
  restaurant_id: string
  name: string
  description: string | null
}

interface Meal {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  dietary_category: string | null
  description: string | null
  ingredients: string[] | null
  allergens: string[] | null
  image_url: string | null
  price: number | null
  availability_status: string | null
  extras_allowed: boolean | null
  extra_choices: string[] | null
  preferences: string[] | null
  pairings_drinks: string[] | null
  side_choices: string[] | null
  allowed_extras: number | null
  preference_options: any | null
  allowed_sides: number | null
  dipping_sauces_included: boolean | null
}

interface Drink {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  image_url: string | null
  ingredients: string[] | null
  tasting_notes: string[] | null
  availability_status: string | null
  pricing: any | null
  pairings_meals: string[] | null
}

interface Special {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  image_url: string | null
  price: number | null
  availability_status: string | null
}

interface MenuTabsProps {
  meals: Meal[]
  drinks: Drink[]
  specials: Special[] // Added specials prop
  gameDayMeals: Meal[] // Added gameDayMeals prop
  categories: Category[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  restaurant: { name: string } // Added restaurant prop to check name
}

interface FilterState {
  categories: string[]
  priceRange: [number, number]
  dietaryCategory: string
}

export function MenuTabs({
  meals,
  drinks,
  specials,
  gameDayMeals,
  categories,
  filters,
  onFiltersChange,
  restaurant, // Added restaurant parameter
}: MenuTabsProps) {
  const [activeTab, setActiveTab] = useState("menu")
  const { cart } = useCartStore()

  const availableMeals = meals.filter((meal) => meal.availability_status !== "sold_out")
  const availableDrinks = drinks.filter((drink) => drink.availability_status !== "sold_out")
  const availableGameDayMeals = gameDayMeals.filter((meal) => meal.availability_status !== "sold_out")

  const showGameDayTab = restaurant.name === "86 Public"

  const getItemsForCategory = (categoryId: string) => {
    const categoryMeals = availableMeals.filter((meal) => meal.category_id === categoryId)
    const categoryDrinks = availableDrinks.filter((drink) => drink.category_id === categoryId)
    return [...categoryMeals, ...categoryDrinks]
  }

  const getAllItems = () => [...availableMeals, ...availableDrinks]

  const mealCategories = categories.filter((category) => {
    const categoryMeals = availableMeals.filter((meal) => meal.category_id === category.id)
    return categoryMeals.length > 0
  })

  const drinkCategories = categories.filter((category) => {
    const categoryDrinks = availableDrinks.filter((drink) => drink.category_id === category.id)
    const categoryMeals = availableMeals.filter((meal) => meal.category_id === category.id)
    return categoryDrinks.length > 0 && categoryMeals.length === 0
  })

  const orderedCategories = [...mealCategories, ...drinkCategories]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  return (
    <div className="w-full">
      <div className="sticky top-[200px] md:top-[240px] z-30 bg-background/95 backdrop-blur-sm border-b pb-2 mb-4 -mx-4 px-4 shadow-sm">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex h-auto p-1 bg-muted/30 min-w-full">
                <div className="flex gap-1 px-2">
                  <TabsTrigger
                    value="menu"
                    className="flex-shrink-0 px-4 py-2 rounded-md text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    Menu
                  </TabsTrigger>
                  <TabsTrigger
                    value="specials"
                    className="flex-shrink-0 px-4 py-2 rounded-md text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    Specials
                  </TabsTrigger>
                  {showGameDayTab && (
                    <TabsTrigger
                      value="gameday"
                      className="flex-shrink-0 px-4 py-2 rounded-md text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                    >
                      Game Day
                    </TabsTrigger>
                  )}
                </div>
              </TabsList>
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/95 via-background/60 to-transparent pointer-events-none flex items-center justify-start pl-1">
              <ChevronLeft className="w-4 h-4 text-primary/80 drop-shadow-sm" />
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 via-background/60 to-transparent pointer-events-none flex items-center justify-end pr-1">
              <ChevronRight className="w-4 h-4 text-primary/80 drop-shadow-sm" />
            </div>
          </div>
        </Tabs>
      </div>

      <div className="relative">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="menu" className="mt-0">
            <div className="mb-4">
              <Tabs value={activeTab === "menu" ? "all" : activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="sticky top-[260px] md:top-[300px] z-20 bg-background/95 backdrop-blur-sm border-b pb-2 mb-4 -mx-4 px-4">
                  <div className="overflow-x-auto scrollbar-hide">
                    <TabsList className="inline-flex h-auto p-1 bg-muted/20 min-w-full">
                      <div className="flex gap-1 px-2">
                        <TabsTrigger
                          value="all"
                          className="flex-shrink-0 px-3 py-2 rounded-md text-xs whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                          All Items
                        </TabsTrigger>
                        {orderedCategories.map((category) => (
                          <TabsTrigger
                            key={category.id}
                            value={category.id}
                            className="flex-shrink-0 px-3 py-2 rounded-md text-xs whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                          >
                            {category.name}
                          </TabsTrigger>
                        ))}
                      </div>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="all" className="mt-0">
                  {getAllItems().length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <span className="text-3xl">🍽️</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No items available</h3>
                      <p className="text-muted-foreground">Check back later or try searching for something else.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAllItems().map((item) => (
                        <MenuItemCard key={item.id} item={item} type={"price" in item ? "meal" : "drink"} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {orderedCategories.map((category) => {
                  const categoryItems = getItemsForCategory(category.id)
                  return (
                    <TabsContent key={category.id} value={category.id} className="mt-0">
                      {categoryItems.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                            <span className="text-3xl">🍽️</span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No items in {category.name}</h3>
                          <p className="text-muted-foreground">Check back later or try a different category.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {categoryItems.map((item) => (
                            <MenuItemCard key={item.id} item={item} type={"price" in item ? "meal" : "drink"} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="specials" className="mt-0">
            {specials.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">No specials available</h3>
                <p className="text-muted-foreground">Check back later for exciting deals and offers!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {specials.map((special) => (
                  <SpecialCard key={special.id} special={special} />
                ))}
              </div>
            )}
          </TabsContent>

          {showGameDayTab && (
            <TabsContent value="gameday" className="mt-0">
              {availableGameDayMeals.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <span className="text-3xl">🏈</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Game Day items available</h3>
                  <p className="text-muted-foreground">Check back during game season for special menu items!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableGameDayMeals.map((meal) => (
                    <MenuItemCard key={meal.id} item={meal} type="meal" />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
