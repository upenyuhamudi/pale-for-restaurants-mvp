"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus } from "lucide-react"
import { formatCurrency, convertGoogleDriveUrl, handleImageError } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { TableNumberModal } from "@/components/restaurant/table-number-modal"

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

interface SideMeal {
  id: string
  name: string
  price: number | null
}

interface ExtraMeal {
  id: string
  name: string
  price: number | null
}

interface MealDetailModalProps {
  meal: Meal
  isOpen: boolean
  onClose: () => void
  fromPairingSuggestion?: boolean
  onReturnToPairingSuggestion?: () => void
}

export function MealDetailModal({
  meal,
  isOpen,
  onClose,
  fromPairingSuggestion = false,
  onReturnToPairingSuggestion,
}: MealDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedSides, setSelectedSides] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [preferences, setPreferences] = useState<Record<string, string>>({})
  const [sideMeals, setSideMeals] = useState<SideMeal[]>([])
  const [extraMeals, setExtraMeals] = useState<ExtraMeal[]>([])
  const [loadingSides, setLoadingSides] = useState(false)
  const [loadingExtras, setLoadingExtras] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)

  const { addMealLine, cart } = useCartStore()
  const { toast } = useToast()

  const getExtraPrice = (extraId: string): number => {
    const extraMeal = extraMeals.find((e) => e.id === extraId)
    return extraMeal?.price ?? 0
  }

  const getSidePrice = (sideId: string): number => {
    if (meal.allowed_sides === 0) {
      const sideMeal = sideMeals.find((s) => s.id === sideId)
      return sideMeal?.price ?? 0
    }
    return 0 // Free when included in meal
  }

  const basePrice = meal.price ?? 0
  const extrasPrice = selectedExtras.reduce((total, extraId) => total + getExtraPrice(extraId), 0)
  const sidesPrice = selectedSides.reduce((total, sideId) => total + getSidePrice(sideId), 0)
  const totalPrice = (basePrice + extrasPrice + sidesPrice) * quantity

  const isSideOrExtra = (meal: Meal): boolean => {
    const category = meal.dietary_category?.toLowerCase()
    return category === "side" || category === "extra" || category === "sides" || category === "extras"
  }

  const fetchSideMeals = async (sideIds: string[]) => {
    if (!sideIds || sideIds.length === 0) return

    setLoadingSides(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("meals").select("id, name, price").in("id", sideIds)

      if (error) {
        console.error("Error fetching side meals:", error)
        return
      }

      setSideMeals(data || [])
    } catch (error) {
      console.error("Error fetching side meals:", error)
    } finally {
      setLoadingSides(false)
    }
  }

  const fetchExtraMeals = async (extraIds: string[]) => {
    if (!extraIds || extraIds.length === 0) return

    setLoadingExtras(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("meals").select("id, name, price").in("id", extraIds)

      if (error) {
        console.error("Error fetching extra meals:", error)
        return
      }

      setExtraMeals(data || [])
    } catch (error) {
      console.error("Error fetching extra meals:", error)
    } finally {
      setLoadingExtras(false)
    }
  }

  const needsDoneness = (meal: Meal): boolean => {
    const name = meal.name.toLowerCase()
    const description = meal.description?.toLowerCase() || ""

    // Check if meal name or description contains steak-related terms
    const steakTerms = ["steak", "sirloin", "fillet", "ribeye", "t-bone", "rump", "beef", "burger", "patty"]
    return steakTerms.some((term) => name.includes(term) || description.includes(term))
  }

  const getDonenessOptions = (): string[] => {
    return ["Rare", "Medium Rare", "Medium", "Medium Well", "Well Done"]
  }

  const getEffectivePreferences = (): string[] => {
    const originalPrefs = meal.preferences || []

    // If meal needs doneness but doesn't have it in preferences, add it
    if (needsDoneness(meal) && !originalPrefs.includes("doneness")) {
      console.log("[v0] Auto-adding doneness preference for:", meal.name)
      return [...originalPrefs, "doneness"]
    }

    return originalPrefs
  }

  const getEffectivePreferenceOptions = (): any => {
    const originalOptions = meal.preference_options || {}

    // If meal needs doneness but doesn't have options, add default ones
    if (needsDoneness(meal) && !originalOptions.doneness) {
      console.log("[v0] Auto-adding doneness options for:", meal.name)
      return {
        ...originalOptions,
        doneness: getDonenessOptions(),
      }
    }

    return originalOptions
  }

  useEffect(() => {
    if (isOpen) {
      console.log("[v0] MealDetailModal opened with meal:", meal.name)
      console.log("[v0] Original meal preferences:", meal.preferences)
      console.log("[v0] Effective preferences:", getEffectivePreferences())
      console.log("[v0] Needs doneness auto-detection:", needsDoneness(meal))
      console.log("[v0] Effective preference options:", getEffectivePreferenceOptions())
      console.log("[v0] From pairing suggestion:", fromPairingSuggestion)

      setQuantity(1)
      setSelectedSides([])
      setSelectedExtras([])
      setPreferences({})
      if (meal.side_choices && meal.side_choices.length > 0 && !isSideOrExtra(meal)) {
        fetchSideMeals(meal.side_choices)
      }
      if (meal.extra_choices && meal.extra_choices.length > 0) {
        fetchExtraMeals(meal.extra_choices)
      }
    }
  }, [isOpen, meal])

  useEffect(() => {
    const effectivePrefs = getEffectivePreferences()
    const effectiveOptions = getEffectivePreferenceOptions()

    if (effectivePrefs && effectiveOptions) {
      const initialPrefs: Record<string, string> = {}
      effectivePrefs.forEach((pref) => {
        if (effectiveOptions[pref]) {
          initialPrefs[pref] = ""
        }
      })
      setPreferences(initialPrefs)
    }
  }, [meal.preferences, meal.preference_options])

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta))
  }

  const handleAddToCart = () => {
    if (!cart.table_number || !cart.diner_name) {
      setShowTableModal(true)
      return
    }

    const requiredPrefs = getEffectivePreferences()
    const missingPrefs = requiredPrefs.filter((pref) => !preferences[pref])
    if (missingPrefs.length > 0) {
      toast({
        title: "Missing preferences",
        description: `Please select: ${missingPrefs.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    addMealLine(
      {
        id: meal.id,
        name: meal.name,
        unitPrice: basePrice + extrasPrice + sidesPrice,
        quantity,
        sideIds: selectedSides,
        extraIds: selectedExtras,
        preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      },
      fromPairingSuggestion,
    )

    toast({
      title: "Added to cart",
      description: `${meal.name} has been added to your cart.`,
    })

    onClose()

    if (fromPairingSuggestion && onReturnToPairingSuggestion) {
      setTimeout(() => {
        onReturnToPairingSuggestion()
      }, 100)
    }
  }

  const isAddDisabled = getEffectivePreferences().some((pref) => !preferences[pref])

  const handleClose = () => {
    console.log("[v0] Modal closing, fromPairingSuggestion:", fromPairingSuggestion)
    onClose()

    if (fromPairingSuggestion && onReturnToPairingSuggestion) {
      console.log("[v0] Returning to pairing suggestions after modal close")
      setTimeout(() => {
        onReturnToPairingSuggestion()
      }, 100)
    }
  }

  const shouldShowSides = () => {
    // Don't show sides for items that are themselves sides or extras
    if (isSideOrExtra(meal)) return false

    // Check if meal has side choices available
    if (!meal.side_choices || meal.side_choices.length === 0) return false

    // Show sides if allowed_sides is explicitly set and > 0
    if (meal.allowed_sides && meal.allowed_sides > 0) return true

    // Also show sides if description mentions sides (fallback for data inconsistency)
    if (meal.description && meal.description.toLowerCase().includes("side")) return true

    return false
  }

  const handleTableNumberSet = () => {
    setShowTableModal(false)
    // Automatically try to add to cart after table number is set
    handleAddToCart()
  }

  return (
    <>
      <TableNumberModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onTableNumberSet={handleTableNumberSet}
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{meal.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {meal.image_url && (
              <div className="aspect-video relative overflow-hidden rounded-xl">
                <img
                  src={convertGoogleDriveUrl(meal.image_url) || "/placeholder.svg"}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
            )}

            {meal.description && <p className="text-muted-foreground leading-relaxed">{meal.description}</p>}

            {meal.allergens && meal.allergens.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Allergens</h4>
                <div className="flex flex-wrap gap-2">
                  {meal.allergens.map((allergen, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {shouldShowSides() && (
              <div>
                <h4 className="font-medium mb-3">
                  Choose Sides
                  <span className="text-sm text-muted-foreground ml-2">
                    ({selectedSides.length}/{meal.allowed_sides || 2} selected)
                  </span>
                </h4>
                {loadingSides ? (
                  <p className="text-sm text-muted-foreground">Loading sides...</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {sideMeals.map((sideMeal) => (
                      <label
                        key={sideMeal.id}
                        className="flex items-center justify-between space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedSides.includes(sideMeal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedSides.length < (meal.allowed_sides || 2)) {
                                  setSelectedSides([...selectedSides, sideMeal.id])
                                }
                              } else {
                                setSelectedSides(selectedSides.filter((s) => s !== sideMeal.id))
                              }
                            }}
                            className="rounded"
                            disabled={
                              !selectedSides.includes(sideMeal.id) && selectedSides.length >= (meal.allowed_sides || 2)
                            }
                          />
                          <span className="flex-1">{sideMeal.name}</span>
                        </div>
                        <span className="text-sm font-medium text-brand-orange">
                          +{formatCurrency(getSidePrice(sideMeal.id))}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedSides.length >= (meal.allowed_sides || 2) && (
                  <p className="text-sm text-muted-foreground mt-2">Maximum sides selected</p>
                )}
              </div>
            )}

            {meal.extras_allowed && meal.extra_choices && meal.extra_choices.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">
                  Add Extras
                  <span className="text-sm text-muted-foreground ml-2">({selectedExtras.length} selected)</span>
                </h4>
                {loadingExtras ? (
                  <p className="text-sm text-muted-foreground">Loading extras...</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {extraMeals.map((extraMeal) => (
                      <label
                        key={extraMeal.id}
                        className="flex items-center justify-between space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedExtras.includes(extraMeal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedExtras.length < (meal.allowed_extras || 0)) {
                                  setSelectedExtras([...selectedExtras, extraMeal.id])
                                }
                              } else {
                                setSelectedExtras(selectedExtras.filter((e) => e !== extraMeal.id))
                              }
                            }}
                            className="rounded border-2 border-gray-300 text-brand-orange focus:ring-brand-orange focus:ring-2"
                            disabled={
                              !selectedExtras.includes(extraMeal.id) &&
                              selectedExtras.length >= (meal.allowed_extras || 0)
                            }
                          />
                          <span className="flex-1 font-medium">{extraMeal.name}</span>
                        </div>
                        <span className="text-sm font-medium text-brand-orange">
                          +{formatCurrency(getExtraPrice(extraMeal.id))}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedExtras.length >= (meal.allowed_extras || 0) && (
                  <p className="text-sm text-muted-foreground mt-2">Maximum extras selected</p>
                )}
              </div>
            )}

            {getEffectivePreferences().length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Preferences</h4>
                <div className="space-y-4">
                  {getEffectivePreferences().map((pref) => {
                    const options = getEffectivePreferenceOptions()[pref]
                    console.log(`[v0] Rendering preference: ${pref}, options:`, options)
                    if (!options || !Array.isArray(options)) {
                      console.log(`[v0] Skipping preference ${pref} - no valid options`)
                      return null
                    }

                    const isDoneness = pref.toLowerCase() === "doneness"

                    return (
                      <div
                        key={pref}
                        className={isDoneness ? "p-3 border-2 border-orange-200 rounded-lg bg-orange-50" : ""}
                      >
                        <label
                          className={`block text-sm font-medium mb-2 capitalize ${isDoneness ? "text-orange-700 font-semibold" : ""}`}
                        >
                          {pref.replace(/_/g, " ")} *
                          {isDoneness && <span className="ml-2 text-xs bg-orange-200 px-2 py-1 rounded">Required</span>}
                        </label>
                        <Select
                          value={preferences[pref] || ""}
                          onValueChange={(value) => {
                            console.log(`[v0] Setting ${pref} to:`, value)
                            setPreferences((prev) => ({ ...prev, [pref]: value }))
                          }}
                        >
                          <SelectTrigger className={isDoneness ? "border-orange-300 focus:border-orange-500" : ""}>
                            <SelectValue placeholder={`Select ${pref.replace(/_/g, " ")}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((option: string) => (
                              <SelectItem key={option} value={option}>
                                {option.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-lg font-semibold">Total: {formatCurrency(totalPrice)}</div>
              <div className="flex flex-col items-end gap-2">
                {isAddDisabled && (
                  <p className="text-xs text-muted-foreground text-right">
                    Please select:{" "}
                    {getEffectivePreferences()
                      .filter((pref) => !preferences[pref])
                      .join(", ")}
                  </p>
                )}
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddDisabled}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white px-8 disabled:opacity-50"
                  size="lg"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
