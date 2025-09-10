"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface MenuItemFormProps {
  restaurantId: string
  itemType: "meal" | "drink"
  item?: any
  onSave: () => void
  onCancel: () => void
}

export function MenuItemForm({ restaurantId, itemType, item, onSave, onCancel }: MenuItemFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    category_id: item?.category_id || "",
    image_url: item?.image_url || "",
    availability_status: item?.availability_status || "available",
    // Meal specific fields
    dietary_category: item?.dietary_category || "Non-Vegetarian",
    allowed_sides: item?.allowed_sides || 0,
    allowed_extras: item?.allowed_extras || 0,
    extras_allowed: item?.extras_allowed || false,
    // Drink specific fields
    pricing: item?.pricing || { glass: null, shot: null, bottle: null, jug: null },
    // Arrays
    ingredients: item?.ingredients || [],
    allergens: item?.allergens || [],
    tasting_notes: item?.tasting_notes || [],
  })
  const [newIngredient, setNewIngredient] = useState("")
  const [newAllergen, setNewAllergen] = useState("")
  const [newTastingNote, setNewTastingNote] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tableName = itemType === "meal" ? "meals" : "drinks"
      const data: any = {
        restaurant_id: restaurantId,
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        availability_status: formData.availability_status,
        ingredients: formData.ingredients,
      }

      if (itemType === "meal") {
        data.price = Number.parseFloat(formData.price) || 0
        data.dietary_category = formData.dietary_category
        data.allowed_sides = Number.parseInt(formData.allowed_sides.toString()) || 0
        data.allowed_extras = Number.parseInt(formData.allowed_extras.toString()) || 0
        data.extras_allowed = formData.extras_allowed
        data.allergens = formData.allergens
      } else {
        data.pricing = formData.pricing
        data.tasting_notes = formData.tasting_notes
      }

      let result
      if (item) {
        // Update existing item
        result = await supabase.from(tableName).update(data).eq("id", item.id)
      } else {
        // Create new item
        result = await supabase.from(tableName).insert(data)
      }

      if (result.error) throw result.error

      onSave()
    } catch (error) {
      console.error(`[v0] Error saving ${itemType}:`, error)
      alert(`Error saving ${itemType}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const addToArray = (arrayName: string, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [arrayName]: [...(prev[arrayName as keyof typeof prev] as string[]), value.trim()],
      }))
      setter("")
    }
  }

  const removeFromArray = (arrayName: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: (prev[arrayName as keyof typeof prev] as string[]).filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium md:text-base">
            Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
            className="min-h-[44px] text-base md:text-sm md:min-h-[40px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium md:text-base">
            Category *
          </Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
          >
            <SelectTrigger className="min-h-[44px] md:min-h-[40px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium md:text-base">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="min-h-[88px] text-base resize-none md:text-sm"
        />
      </div>

      {itemType === "meal" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium md:text-base">
                Price (R) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                required
                className="min-h-[44px] text-base md:text-sm md:min-h-[40px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary_category" className="text-sm font-medium md:text-base">
                Dietary Category
              </Label>
              <Select
                value={formData.dietary_category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dietary_category: value }))}
              >
                <SelectTrigger className="min-h-[44px] md:min-h-[40px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                  <SelectItem value="Vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability" className="text-sm font-medium md:text-base">
                Availability
              </Label>
              <Select
                value={formData.availability_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, availability_status: value }))}
              >
                <SelectTrigger className="min-h-[44px] md:min-h-[40px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="allowed_sides" className="text-sm font-medium md:text-base">
                Allowed Sides
              </Label>
              <Input
                id="allowed_sides"
                type="number"
                min="0"
                value={formData.allowed_sides}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allowed_sides: Number.parseInt(e.target.value) || 0 }))
                }
                className="min-h-[44px] text-base md:text-sm md:min-h-[40px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_extras" className="text-sm font-medium md:text-base">
                Allowed Extras
              </Label>
              <Input
                id="allowed_extras"
                type="number"
                min="0"
                value={formData.allowed_extras}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allowed_extras: Number.parseInt(e.target.value) || 0 }))
                }
                className="min-h-[44px] text-base md:text-sm md:min-h-[40px]"
              />
            </div>

            <div className="flex items-center space-x-3 pt-6 min-h-[44px]">
              <Switch
                id="extras_allowed"
                checked={formData.extras_allowed}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, extras_allowed: checked }))}
                className="data-[state=checked]:bg-brand-orange"
              />
              <Label htmlFor="extras_allowed" className="text-sm font-medium md:text-base">
                Extras Allowed
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium md:text-base">Allergens</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              <Input
                placeholder="Add allergen"
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addToArray("allergens", newAllergen, setNewAllergen))
                }
                className="flex-1 min-h-[44px] text-base md:text-sm md:min-h-[40px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addToArray("allergens", newAllergen, setNewAllergen)}
                className="min-h-[44px] px-4 md:min-h-[40px] md:px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="ml-2 sm:hidden">Add</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.allergens.map((allergen, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-2 py-2 px-3 text-sm">
                  <span>{allergen}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray("allergens", index)}
                    className="hover:bg-destructive/20 rounded-full p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <Label className="text-sm font-medium md:text-base">Pricing (R)</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {["glass", "shot", "bottle", "jug"].map((variant) => (
                <div key={variant} className="space-y-2">
                  <Label htmlFor={variant} className="text-sm capitalize font-medium">
                    {variant}
                  </Label>
                  <Input
                    id={variant}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.pricing[variant] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          [variant]: e.target.value ? Number.parseFloat(e.target.value) : null,
                        },
                      }))
                    }
                    className="min-h-[44px] text-base md:text-sm md:min-h-[40px]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium md:text-base">Tasting Notes</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              <Input
                placeholder="Add tasting note"
                value={newTastingNote}
                onChange={(e) => setNewTastingNote(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addToArray("tasting_notes", newTastingNote, setNewTastingNote))
                }
                className="flex-1 min-h-[44px] text-base md:text-sm md:min-h-[40px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addToArray("tasting_notes", newTastingNote, setNewTastingNote)}
                className="min-h-[44px] px-4 md:min-h-[40px] md:px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="ml-2 sm:hidden">Add</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tasting_notes.map((note, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-2 py-2 px-3 text-sm">
                  <span>{note}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray("tasting_notes", index)}
                    className="hover:bg-destructive/20 rounded-full p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-3">
        <Label className="text-sm font-medium md:text-base">Ingredients</Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Input
            placeholder="Add ingredient"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addToArray("ingredients", newIngredient, setNewIngredient))
            }
            className="flex-1 min-h-[44px] text-base md:text-sm md:min-h-[40px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addToArray("ingredients", newIngredient, setNewIngredient)}
            className="min-h-[44px] px-4 md:min-h-[40px] md:px-3"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2 sm:hidden">Add</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.ingredients.map((ingredient, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-2 py-2 px-3 text-sm">
              <span>{ingredient}</span>
              <button
                type="button"
                onClick={() => removeFromArray("ingredients", index)}
                className="hover:bg-destructive/20 rounded-full p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url" className="text-sm font-medium md:text-base">
          Image URL
        </Label>
        <Input
          id="image_url"
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          className="min-h-[44px] text-base md:text-sm md:min-h-[40px]"
        />
      </div>

      <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white min-h-[44px] order-1 sm:order-1 md:min-h-[40px]"
          size="lg"
        >
          {loading ? "Saving..." : item ? "Update Item" : "Create Item"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-[44px] order-2 sm:order-2 md:min-h-[40px] bg-transparent"
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
