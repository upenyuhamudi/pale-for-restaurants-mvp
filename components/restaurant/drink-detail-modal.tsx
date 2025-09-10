"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus } from "lucide-react"
import { formatCurrency, resolveDrinkUnitPrice, convertGoogleDriveUrl, handleImageError } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

interface DrinkDetailModalProps {
  drink: Drink
  isOpen: boolean
  onClose: () => void
  fromPairingSuggestion?: boolean
  onReturnToPairingSuggestion?: () => void
}

export function DrinkDetailModal({
  drink,
  isOpen,
  onClose,
  fromPairingSuggestion = false,
  onReturnToPairingSuggestion,
}: DrinkDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string>("")

  const { addDrinkLine, cart } = useCartStore()
  const { toast } = useToast()

  const availableVariants = useMemo(() => {
    if (!drink.pricing) return []
    return Object.keys(drink.pricing).filter((key) => drink.pricing[key] !== null)
  }, [drink.pricing])

  useEffect(() => {
    console.log("[v0] DrinkDetailModal state change:", {
      isOpen,
      drinkName: drink.name,
      availableVariants,
      selectedVariant,
    })

    if (isOpen) {
      if (availableVariants.length > 0 && !selectedVariant) {
        const defaultVariant = availableVariants[0]
        console.log("[v0] Setting default variant:", defaultVariant)
        setSelectedVariant(defaultVariant)
      }
    } else {
      console.log("[v0] Resetting modal state on close")
      setSelectedVariant("")
      setQuantity(1)
    }
  }, [isOpen, drink.pricing])

  const unitPrice = selectedVariant ? resolveDrinkUnitPrice(drink.pricing, selectedVariant) : 0
  const totalPrice = unitPrice * quantity

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta))
  }

  const handleVariantClick = (variant: string) => {
    console.log("[v0] Variant button clicked:", {
      clickedVariant: variant,
      currentSelected: selectedVariant,
      willChange: variant !== selectedVariant,
      cartState: cart,
      modalOpen: isOpen,
    })
    setSelectedVariant(variant)
  }

  const handleAddToCart = () => {
    console.log("[v0] Add to cart clicked:", {
      hasTableNumber: !!cart.table_number,
      selectedVariant,
      quantity,
      unitPrice,
      cartLines: cart.lines.length,
      restaurantId: cart.restaurant_id,
      dinerName: cart.diner_name,
    })

    if (!cart.table_number) {
      toast({
        title: "Table number required",
        description: "Please set your table number before adding items to cart.",
        variant: "destructive",
      })
      return
    }

    // Validate serving variant is selected
    if (!selectedVariant) {
      toast({
        title: "Serving size required",
        description: "Please select a serving size.",
        variant: "destructive",
      })
      return
    }

    addDrinkLine(
      {
        id: drink.id,
        name: drink.name,
        variant: selectedVariant as "glass" | "jug" | "bottle" | "shot",
        unitPrice: unitPrice,
        quantity,
      },
      fromPairingSuggestion,
    )

    console.log("[v0] Item added to cart successfully")
    console.log("[v0] Cart state after adding item:", {
      totalLines: cart.lines.length + 1,
      tableNumber: cart.table_number,
      dinerName: cart.diner_name,
    })

    toast({
      title: "Added to cart",
      description: `${drink.name} (${selectedVariant}) has been added to your cart.`,
    })

    onClose()

    if (fromPairingSuggestion && onReturnToPairingSuggestion) {
      onReturnToPairingSuggestion()
    }
  }

  const isAddDisabled = !cart.table_number || !selectedVariant

  console.log("[v0] Add to Cart button state:", {
    isDisabled: isAddDisabled,
    hasTableNumber: !!cart.table_number,
    hasSelectedVariant: !!selectedVariant,
    selectedVariant,
    modalOpen: isOpen,
    drinkName: drink.name,
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto mx-auto md:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold md:text-xl">{drink.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Image */}
          {drink.image_url && (
            <div
              className="w-full relative overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center md:rounded-xl"
              style={{ aspectRatio: "1/1", maxHeight: "250px" }}
            >
              <img
                src={convertGoogleDriveUrl(drink.image_url) || "/placeholder.svg"}
                alt={drink.name}
                className="w-full h-full object-cover object-center"
                onError={handleImageError}
              />
            </div>
          )}

          {/* Description */}
          {drink.description && (
            <p className="text-sm text-muted-foreground leading-relaxed md:text-base">{drink.description}</p>
          )}

          {/* Tasting Notes */}
          {drink.tasting_notes && drink.tasting_notes.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm md:text-base">Tasting Notes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed break-words md:text-sm">
                {drink.tasting_notes.join(", ")}
              </p>
            </div>
          )}

          <Separator />

          {/* Serving Type Selection */}
          {availableVariants.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-sm md:text-base">Choose Serving Size *</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {availableVariants.map((variant) => (
                  <button
                    key={variant}
                    onClick={() => handleVariantClick(variant)}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-md border-2 transition-all duration-200 w-full min-h-[60px]",
                      "hover:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/20",
                      selectedVariant === variant
                        ? "border-brand-orange bg-brand-orange text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    <span className="capitalize font-medium text-sm md:text-base">{variant}</span>
                    <span
                      className={cn("text-xs md:text-sm", selectedVariant === variant ? "opacity-90" : "opacity-60")}
                    >
                      {formatCurrency(drink.pricing[variant])}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm md:text-base">Quantity</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-10 w-10 min-h-[44px] min-w-[44px] md:h-8 md:w-8 md:min-h-[32px] md:min-w-[32px]"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-base md:text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] md:h-8 md:w-8 md:min-h-[32px] md:min-w-[32px]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 pt-4 border-t md:flex-row md:items-center md:justify-between">
            <div className="text-lg font-semibold order-2 text-center md:order-1 md:text-left md:text-xl">
              Total: {formatCurrency(totalPrice)}
            </div>
            <Button
              onClick={() => {
                console.log("[v0] Add to Cart button clicked - event triggered")
                handleAddToCart()
              }}
              disabled={isAddDisabled}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white px-6 disabled:opacity-50 min-h-[44px] order-1 md:order-2 md:px-8"
              size="lg"
              onMouseDown={() => console.log("[v0] Add to Cart button mouse down")}
              onMouseUp={() => console.log("[v0] Add to Cart button mouse up")}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
