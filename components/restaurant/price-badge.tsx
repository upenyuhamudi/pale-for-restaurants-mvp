"use client"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface Meal {
  price: number | null
}

interface Drink {
  pricing: any | null
}

interface PriceBadgeProps {
  item: Meal | Drink
  type: "meal" | "drink"
}

export function PriceBadge({ item, type }: PriceBadgeProps) {
  if (type === "meal") {
    const meal = item as Meal
    if (!meal.price) return null

    return (
      <Badge className="bg-background/90 text-foreground border shadow-sm font-semibold">
        {formatCurrency(meal.price)}
      </Badge>
    )
  }

  if (type === "drink") {
    const drink = item as Drink
    if (!drink.pricing) return null

    const prices = Object.values(drink.pricing).filter((price): price is number => price !== null)
    if (prices.length === 0) return null

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    return (
      <Badge className="bg-background/90 text-foreground border shadow-sm font-semibold">
        {minPrice === maxPrice ? formatCurrency(minPrice) : `From ${formatCurrency(minPrice)}`}
      </Badge>
    )
  }

  return null
}
