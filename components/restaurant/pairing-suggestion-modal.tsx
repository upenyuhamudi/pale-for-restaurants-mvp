"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { toast } from "@/hooks/use-toast"

interface Meal {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  dietary_category: string
  pairings_drinks: string[]
  side_choices?: string[]
  extra_choices?: string[]
  preferences?: string[]
}

interface Drink {
  id: string
  name: string
  description: string
  pricing: {
    glass?: number
    bottle?: number
    jug?: number
    shot?: number
  }
  image_url: string
  pairings_meals: string[]
}

interface PairingSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  addedItem: {
    type: "meal" | "drink"
    id: string
    name: string
  } | null
  restaurantId: string
  onOpenMealModal?: (meal: Meal) => void
  onOpenDrinkModal?: (drink: Drink) => void
}

export function PairingSuggestionModal({
  isOpen,
  onClose,
  addedItem,
  restaurantId,
  onOpenMealModal,
  onOpenDrinkModal,
}: PairingSuggestionModalProps) {
  const [suggestions, setSuggestions] = useState<(Meal | Drink)[]>([])
  const [loading, setLoading] = useState(false)
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set())
  const { addMealLine, addDrinkLine } = useCartStore()

  useEffect(() => {
    console.log("[v0] PairingSuggestionModal useEffect:", { isOpen, addedItem })
    if (isOpen && addedItem) {
      fetchSuggestions()
      setAddedSuggestions(new Set())
    }
  }, [isOpen, addedItem])

  const fetchSuggestions = async () => {
    if (!addedItem) return

    console.log("[v0] Fetching suggestions for:", addedItem)
    setLoading(true)
    const supabase = await createClient()

    try {
      if (addedItem.type === "meal") {
        const { data: meal, error: mealError } = await supabase
          .from("meals")
          .select("pairings_drinks")
          .eq("id", addedItem.id)
          .single()

        console.log("[v0] Meal pairing data:", { meal, mealError })

        if (meal?.pairings_drinks !== undefined && meal.pairings_drinks.length === 0) {
          console.log("[v0] Meal has empty pairings_drinks array, closing modal")
          onClose()
          return
        }

        if (meal?.pairings_drinks && meal.pairings_drinks.length > 0) {
          const { data: drinks, error } = await supabase
            .from("drinks")
            .select("id, name, description, pricing, image_url")
            .in("id", meal.pairings_drinks)
            .eq("restaurant_id", restaurantId)
            .eq("availability_status", "available")
            .limit(3)

          console.log("[v0] Paired drinks query result:", { drinks, error })
          setSuggestions(drinks || [])
        } else {
          console.log("[v0] No pairings_drinks found for meal, falling back to category query")
          const { data: drinks, error } = await supabase
            .from("drinks")
            .select("id, name, description, pricing, image_url")
            .eq("restaurant_id", restaurantId)
            .or("category_id.eq.cat_cocktails,category_id.eq.cat_wines,category_id.eq.cat_spirits")
            .eq("availability_status", "available")
            .limit(2)

          console.log("[v0] Fallback drinks query result:", { drinks, error })
          setSuggestions(drinks || [])
        }
      } else {
        const { data: drink, error: drinkError } = await supabase
          .from("drinks")
          .select("pairings_meals")
          .eq("id", addedItem.id)
          .single()

        console.log("[v0] Drink pairing data:", { drink, drinkError })

        if (drink?.pairings_meals !== undefined && drink.pairings_meals.length === 0) {
          console.log("[v0] Drink has empty pairings_meals array, closing modal")
          onClose()
          return
        }

        if (drink?.pairings_meals && drink.pairings_meals.length > 0) {
          const { data: meals, error } = await supabase
            .from("meals")
            .select(
              "id, name, description, price, image_url, dietary_category, side_choices, extra_choices, preferences",
            )
            .in("id", drink.pairings_meals)
            .eq("restaurant_id", restaurantId)
            .eq("availability_status", "available")
            .limit(3)

          console.log("[v0] Paired meals query result:", { meals, error })
          setSuggestions(meals || [])
        } else {
          console.log("[v0] No pairings_meals found for drink, falling back to category query")
          const { data: meals, error } = await supabase
            .from("meals")
            .select(
              "id, name, description, price, image_url, dietary_category, side_choices, extra_choices, preferences",
            )
            .eq("restaurant_id", restaurantId)
            .not("dietary_category", "in", "(Side,Extra,Dessert,Sides,Extras,Desserts)")
            .eq("availability_status", "available")
            .limit(2)

          console.log("[v0] Fallback meals query result:", { meals, error })
          setSuggestions(meals || [])
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const needsCustomization = (suggestion: Meal | Drink) => {
    if ("price" in suggestion) {
      const meal = suggestion as Meal & { side_choices?: string[]; extra_choices?: string[]; preferences?: string[] }
      return (
        (meal.side_choices && meal.side_choices.length > 0) ||
        (meal.extra_choices && meal.extra_choices.length > 0) ||
        (meal.preferences && meal.preferences.length > 0)
      )
    } else {
      const pricing = suggestion.pricing
      const availableVariants = Object.keys(pricing).filter((key) => pricing[key as keyof typeof pricing] !== undefined)
      return availableVariants.length > 1
    }
  }

  const handleAddSuggestion = async (suggestion: Meal | Drink) => {
    console.log("[v0] Adding suggestion to cart:", suggestion)

    if (needsCustomization(suggestion)) {
      console.log("[v0] Item needs customization, opening detail modal")

      if ("price" in suggestion) {
        if (onOpenMealModal) {
          onOpenMealModal(suggestion)
          onClose()
        }
      } else {
        if (onOpenDrinkModal) {
          onOpenDrinkModal(suggestion)
          onClose()
        }
      }
      return
    }

    try {
      if ("price" in suggestion) {
        addMealLine(
          {
            id: suggestion.id,
            name: suggestion.name,
            unitPrice: suggestion.price ?? 0,
            quantity: 1,
            sideIds: [],
            extraIds: [],
            preferences: {},
          },
          true,
        )
      } else {
        const pricing = suggestion.pricing
        const defaultVariant = pricing.glass ? "glass" : pricing.bottle ? "bottle" : pricing.jug ? "jug" : "shot"
        const unitPrice = pricing[defaultVariant as keyof typeof pricing] || 0

        addDrinkLine(
          {
            id: suggestion.id,
            name: suggestion.name,
            variant: defaultVariant as "glass" | "bottle" | "jug" | "shot",
            unitPrice,
            quantity: 1,
          },
          true,
        )
      }

      setAddedSuggestions((prev) => new Set([...prev, suggestion.id]))

      toast({
        title: "Added to cart",
        description: `${suggestion.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("[v0] Error adding suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      })
    }
  }

  const getSuggestionPrice = (suggestion: Meal | Drink) => {
    if ("price" in suggestion) {
      return formatCurrency(suggestion.price)
    } else {
      const pricing = suggestion.pricing
      const price = pricing.glass || pricing.bottle || pricing.jug || pricing.shot || 0
      return formatCurrency(price)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-md mx-4 md:mx-auto">
        <DialogHeader className="pb-3 md:pb-4">
          <DialogTitle className="text-center text-xl md:text-2xl font-bold">Perfect Pairings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Great choice! Here are some perfect pairings with your {addedItem?.name}:
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-16 md:h-20 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const isAdded = addedSuggestions.has(suggestion.id)
                const requiresCustomization = needsCustomization(suggestion)

                return (
                  <Card
                    key={suggestion.id}
                    className={`overflow-hidden transition-colors ${isAdded ? "bg-green-50 border-green-200" : ""}`}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 md:w-12 md:h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {suggestion.image_url ? (
                            <img
                              src={suggestion.image_url || "/placeholder.svg"}
                              alt={suggestion.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base truncate">{suggestion.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.description}</p>
                          <p className="text-sm font-semibold text-primary">{getSuggestionPrice(suggestion)}</p>
                          {requiresCustomization && <p className="text-xs text-muted-foreground">Tap to customize</p>}
                        </div>

                        {isAdded ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="bg-green-100 border-green-300 text-green-700 flex-shrink-0 h-10 w-10 md:h-8 md:w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddSuggestion(suggestion)}
                            className="bg-brand-orange hover:bg-brand-orange/90 text-white flex-shrink-0 h-10 w-10 md:h-8 md:w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <p className="text-sm text-muted-foreground">No pairings available at the moment.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent min-h-[48px] md:min-h-[44px]">
              No Thanks
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-brand-purple hover:bg-brand-purple/90 min-h-[48px] md:min-h-[44px]"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
