"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MealDetailModal } from "@/components/restaurant/meal-detail-modal"
import { DrinkDetailModal } from "@/components/restaurant/drink-detail-modal"
import { useCartStore } from "@/store/cart"
import { cn, formatCurrency, convertGoogleDriveUrl, handleImageError } from "@/lib/utils"

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

interface MenuItemCardProps {
  item: Meal | Drink
  type: "meal" | "drink"
}

export function MenuItemCard({ item, type }: MenuItemCardProps) {
  const [showModal, setShowModal] = useState(false)
  const { addMealLine, addDrinkLine, tableNumber } = useCartStore()

  const isSoldOut = item.availability_status === "sold_out"
  const isHidden = item.availability_status === "hidden"

  if (isHidden) {
    return null
  }

  const handleCardClick = () => {
    if (!isSoldOut) {
      setShowModal(true)
    }
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()

    console.log("[v0] Plus button clicked for:", item.name, "type:", type)

    // Table number will be required when actually adding to cart in the modal
    setShowModal(true)
  }

  const getDisplayPrice = () => {
    if (type === "meal") {
      return (item as Meal).price ? formatCurrency((item as Meal).price!) : "Price varies"
    } else {
      const pricing = (item as Drink).pricing
      if (!pricing) return "Price varies"

      const prices = Object.values(pricing).filter((p) => p !== null) as number[]
      if (prices.length === 0) return "Price varies"

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      if (minPrice === maxPrice) {
        return formatCurrency(minPrice)
      } else {
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
      }
    }
  }

  return (
    <>
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card border border-border/50 rounded-xl overflow-hidden active:scale-[0.98] md:active:scale-100",
          isSoldOut && "opacity-60 cursor-not-allowed",
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4 min-h-[100px] md:gap-4 md:p-4 md:min-h-[96px]">
            <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted/30 md:w-20 md:h-20 lg:w-24 lg:h-24">
              {item.image_url ? (
                <img
                  src={convertGoogleDriveUrl(item.image_url) || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                  <span className="text-3xl md:text-2xl lg:text-3xl">{type === "meal" ? "🍽️" : "🥤"}</span>
                </div>
              )}

              {isSoldOut && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="destructive" className="text-xs font-medium">
                    Sold Out
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors md:text-base md:line-clamp-1 lg:text-lg lg:line-clamp-2">
                {item.name}
              </h3>

              {item.description && (
                <p className="text-base text-muted-foreground line-clamp-2 mt-2 leading-relaxed md:text-sm md:line-clamp-1 md:mt-1 lg:text-base lg:line-clamp-2 lg:mt-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 md:mt-3 lg:mt-4">
                <span className="text-primary font-bold text-xl md:text-lg lg:text-xl">{getDisplayPrice()}</span>

                {!isSoldOut && (
                  <Button
                    size="sm"
                    className="h-12 w-12 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg relative z-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 md:h-10 md:w-10 lg:h-12 lg:w-12"
                    onClick={handleQuickAdd}
                    style={{ pointerEvents: "auto" }}
                  >
                    <Plus className="h-6 w-6 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {type === "meal" ? (
        <MealDetailModal meal={item as Meal} isOpen={showModal} onClose={() => setShowModal(false)} />
      ) : (
        <DrinkDetailModal drink={item as Drink} isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
