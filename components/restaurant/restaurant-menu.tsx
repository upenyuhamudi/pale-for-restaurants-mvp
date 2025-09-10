"use client"

import { useEffect, useState } from "react"
import { useCartStore } from "@/store/cart"
import { useRestaurantStore } from "@/store/use-restaurant-store"
import { TableNumberModal } from "@/components/restaurant/table-number-modal"
import { MenuHeader } from "@/components/restaurant/menu-header"
import { MenuTabs } from "@/components/restaurant/menu-tabs"
import { CartSidebar } from "@/components/restaurant/cart-sidebar"
import { PairingSuggestionModal } from "@/components/restaurant/pairing-suggestion-modal"
import { BottomNavigation } from "@/components/restaurant/bottom-navigation"
import { MealDetailModal } from "@/components/restaurant/meal-detail-modal"
import { DrinkDetailModal } from "@/components/restaurant/drink-detail-modal"

interface Restaurant {
  id: string
  name: string
  logo_url: string | null
  header_image: string | null
  category: string | null
  about: string | null
  location: string | null
}

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

interface RestaurantMenuProps {
  restaurant: Restaurant
  categories: Category[]
  meals: Meal[]
  drinks: Drink[]
}

interface FilterState {
  categories: string[]
  priceRange: [number, number]
  dietaryCategory: string
}

export function RestaurantMenu({ restaurant, categories, meals, drinks }: RestaurantMenuProps) {
  const [showTableModal, setShowTableModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    dietaryCategory: "all",
  })

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null)
  const [mealFromPairing, setMealFromPairing] = useState(false)
  const [drinkFromPairing, setDrinkFromPairing] = useState(false)

  const {
    cart,
    setRestaurant,
    setTableNumber,
    setDinerName,
    validateRestaurant,
    pairingSuggestion,
    hidePairingSuggestion,
    showPairingSuggestion,
  } = useCartStore()
  const { setCurrentRestaurant, setCategories, setMeals, setDrinks } = useRestaurantStore()

  const maxPrice = Math.max(
    ...meals.map((m) => m.price || 0),
    ...drinks.flatMap((d) => Object.values(d.pricing || {}).filter(Boolean) as number[]),
  )

  useEffect(() => {
    console.log("[v0] RestaurantMenu useEffect triggered")
    setCurrentRestaurant(restaurant)
    setCategories(categories)
    setMeals(meals)
    setDrinks(drinks)

    if (!validateRestaurant(restaurant.id)) {
      useCartStore.getState().clear()
    }

    setRestaurant(restaurant.id)

    const storedDinerName = localStorage.getItem("dinerName")
    const storedTableNumber = localStorage.getItem("tableNumber")

    console.log("[v0] Checking localStorage for diner info:", { storedDinerName, storedTableNumber })
    console.log("[v0] Current cart state before loading:", {
      table_number: cart.table_number,
      diner_name: cart.diner_name,
    })

    if (storedDinerName && !cart.diner_name) {
      console.log("[v0] Loading diner name from localStorage:", storedDinerName)
      setDinerName(storedDinerName)
      setTimeout(() => {
        const updatedCart = useCartStore.getState().cart
        console.log("[v0] Cart state after setDinerName:", updatedCart)
      }, 100)
    }

    if (storedTableNumber && !cart.table_number) {
      console.log("[v0] Loading table number from localStorage:", storedTableNumber)
      setTableNumber(storedTableNumber)
      setTimeout(() => {
        const updatedCart = useCartStore.getState().cart
        console.log("[v0] Cart state after setTableNumber:", updatedCart)
      }, 100)
    }

    setTimeout(() => {
      const finalCart = useCartStore.getState().cart
      console.log("[v0] Final cart state after all localStorage loading:", {
        table_number: finalCart.table_number,
        diner_name: finalCart.diner_name,
        hasTableNumber: !!finalCart.table_number,
        hasDinerName: !!finalCart.diner_name,
      })
    }, 200)

    const hasShownTableModal = sessionStorage.getItem(`table-modal-shown-${restaurant.id}`)
    if ((!cart.table_number || !cart.diner_name) && !hasShownTableModal && !storedTableNumber && !storedDinerName) {
      setShowTableModal(true)
    }

    setFilters((prev) => ({
      ...prev,
      priceRange: [0, maxPrice],
    }))
  }, [
    restaurant,
    categories,
    meals,
    drinks,
    cart.table_number,
    cart.diner_name,
    setCurrentRestaurant,
    setCategories,
    setMeals,
    setDrinks,
    setRestaurant,
    setTableNumber, // Added setTableNumber dependency
    setDinerName, // Added setDinerName dependency
    validateRestaurant,
    maxPrice,
  ])

  const handleTableNumberSet = () => {
    setShowTableModal(false)
    sessionStorage.setItem(`table-modal-shown-${restaurant.id}`, "true")
  }

  const handleOpenMealModal = (meal: Meal) => {
    setSelectedMeal(meal)
    setMealFromPairing(false) // Regular meal modal opening
  }

  const handleOpenDrinkModal = (drink: Drink) => {
    setSelectedDrink(drink)
    setDrinkFromPairing(false) // Regular drink modal opening
  }

  const handleOpenMealModalFromPairing = (meal: Meal) => {
    setSelectedMeal(meal)
    setMealFromPairing(true)
  }

  const handleOpenDrinkModalFromPairing = (drink: Drink) => {
    setSelectedDrink(drink)
    setDrinkFromPairing(true)
  }

  const handleReturnToPairingSuggestion = () => {
    // Reopen the pairing suggestion modal with the same context
    if (pairingSuggestion.addedItem) {
      showPairingSuggestion(pairingSuggestion.addedItem)
    }
  }

  const filteredMeals = meals.filter((meal) => {
    const matchesSearch =
      !searchQuery ||
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.ingredients?.some((ingredient) => ingredient.toLowerCase().includes(searchQuery.toLowerCase())) ||
      categories
        .find((c) => c.id === meal.category_id)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (meal.price && meal.price.toString().includes(searchQuery))

    const matchesCategory =
      filters.categories.length === 0 || (meal.category_id && filters.categories.includes(meal.category_id))

    const matchesPrice = !meal.price || (meal.price >= filters.priceRange[0] && meal.price <= filters.priceRange[1])

    const matchesDietary = filters.dietaryCategory === "all" || meal.dietary_category === filters.dietaryCategory

    return matchesSearch && matchesCategory && matchesPrice && matchesDietary
  })

  const filteredDrinks = drinks.filter((drink) => {
    const matchesSearch =
      !searchQuery ||
      drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drink.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drink.tasting_notes?.some((note) => note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      categories
        .find((c) => c.id === drink.category_id)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesCategory =
      filters.categories.length === 0 || (drink.category_id && filters.categories.includes(drink.category_id))

    const drinkPrices = Object.values(drink.pricing || {}).filter(Boolean) as number[]
    const matchesPrice =
      drinkPrices.length === 0 ||
      drinkPrices.some((price) => price >= filters.priceRange[0] && price <= filters.priceRange[1])

    return matchesSearch && matchesCategory && matchesPrice
  })

  return (
    <>
      <TableNumberModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onTableNumberSet={handleTableNumberSet}
      />

      <PairingSuggestionModal
        isOpen={pairingSuggestion.isOpen}
        onClose={hidePairingSuggestion}
        addedItem={pairingSuggestion.addedItem}
        restaurantId={restaurant.id}
        onOpenMealModal={handleOpenMealModalFromPairing}
        onOpenDrinkModal={handleOpenDrinkModalFromPairing}
      />

      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          isOpen={!!selectedMeal}
          onClose={() => {
            setSelectedMeal(null)
            setMealFromPairing(false)
          }}
          fromPairingSuggestion={mealFromPairing}
          onReturnToPairingSuggestion={handleReturnToPairingSuggestion}
        />
      )}

      {selectedDrink && (
        <DrinkDetailModal
          drink={selectedDrink}
          isOpen={!!selectedDrink}
          onClose={() => {
            setSelectedDrink(null)
            setDrinkFromPairing(false)
          }}
          fromPairingSuggestion={drinkFromPairing}
          onReturnToPairingSuggestion={handleReturnToPairingSuggestion}
        />
      )}

      <div className="flex flex-col min-h-screen overflow-x-hidden bg-background">
        <MenuHeader
          restaurant={restaurant}
          tableNumber={cart.table_number}
          dinerName={cart.diner_name}
          onEditTable={() => setShowTableModal(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          filters={filters}
          onFiltersChange={setFilters}
          maxPrice={maxPrice}
        />

        <main className="flex-1 pb-20 md:pb-0">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
            <div className="flex gap-6 lg:gap-8">
              <div className="flex-1 min-w-0">
                <MenuTabs meals={filteredMeals} drinks={filteredDrinks} categories={categories} />
              </div>

              <div className="hidden lg:block w-80 xl:w-96">
                <div className="sticky top-24 p-4">
                  <CartSidebar />
                </div>
              </div>
            </div>
          </div>
        </main>

        <BottomNavigation />
      </div>
    </>
  )
}
