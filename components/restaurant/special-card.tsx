"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Percent, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Special {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  special_type: string
  original_price: any | null
  special_price: any | null
  discount_percentage: number | null
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  days_of_week: any | null
  max_redemptions: number | null
  current_redemptions: number | null
  availability_status: string | null
  is_featured: boolean | null
  image_url: string | null
  terms_and_conditions: string | null
}

interface SpecialCardProps {
  special: Special
}

export function SpecialCard({ special }: SpecialCardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { addMealLine } = useCartStore()

  const handleAddToCart = async () => {
    setIsAdding(true)

    try {
      const mealLine = {
        id: special.id,
        name: special.name,
        unitPrice: special.special_price?.amount || special.original_price?.amount || 0,
        quantity: 1,
        sideIds: [],
        extraIds: [],
        // No preferences stored for specials to keep cart display clean
      }

      addMealLine(mealLine, true)
    } catch (error) {
      console.error("[v0] Error adding special to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const formatSchedule = () => {
    const parts = []

    if (special.start_time && special.end_time) {
      parts.push(`${special.start_time} - ${special.end_time}`)
    }

    if (special.days_of_week && Array.isArray(special.days_of_week)) {
      parts.push(special.days_of_week.join(", "))
    }

    return parts.join(" • ")
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {special.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={special.image_url || "/placeholder.svg"}
                alt={special.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">{special.name}</h3>
              {special.special_type && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {special.special_type}
                </Badge>
              )}
            </div>
            {special.is_featured && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">Featured</Badge>
            )}
          </div>

          {/* Description */}
          {special.description && <p className="text-muted-foreground leading-relaxed">{special.description}</p>}

          {/* Pricing */}
          <div className="flex items-center gap-3">
            {special.original_price && special.special_price && (
              <>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(special.special_price.amount)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(special.original_price.amount)}
                </span>
                {special.discount_percentage && (
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    <Percent className="w-3 h-3 mr-1" />
                    {special.discount_percentage}% OFF
                  </Badge>
                )}
              </>
            )}
            {special.special_price && !special.original_price && (
              <span className="text-2xl font-bold text-green-600">{formatCurrency(special.special_price.amount)}</span>
            )}
          </div>

          {/* Schedule */}
          {(special.start_time || special.days_of_week) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatSchedule()}</span>
            </div>
          )}

          {/* Date Range */}
          {(special.start_date || special.end_date) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {special.start_date && special.end_date
                  ? `${new Date(special.start_date).toLocaleDateString()} - ${new Date(special.end_date).toLocaleDateString()}`
                  : special.start_date
                    ? `From ${new Date(special.start_date).toLocaleDateString()}`
                    : `Until ${new Date(special.end_date!).toLocaleDateString()}`}
              </span>
            </div>
          )}

          {/* Availability */}
          {special.max_redemptions && (
            <div className="text-sm text-muted-foreground">
              {special.current_redemptions || 0} of {special.max_redemptions} claimed
            </div>
          )}

          {/* Terms */}
          {special.terms_and_conditions && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <strong>Terms:</strong> {special.terms_and_conditions}
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
