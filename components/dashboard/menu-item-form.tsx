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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
          >
            <SelectTrigger>
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

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      {itemType === "meal" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (R) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="dietary_category">Dietary Category</Label>
              <Select
                value={formData.dietary_category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dietary_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                  <SelectItem value="Vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="availability">Availability</Label>
              <Select
                value={formData.availability_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, availability_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="allowed_sides">Allowed Sides</Label>
              <Input
                id="allowed_sides"
                type="number"
                min="0"
                value={formData.allowed_sides}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allowed_sides: Number.parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div>
              <Label htmlFor="allowed_extras">Allowed Extras</Label>
              <Input
                id="allowed_extras"
                type="number"
                min="0"
                value={formData.allowed_extras}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allowed_extras: Number.parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="extras_allowed"
                checked={formData.extras_allowed}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, extras_allowed: checked }))}
              />
              <Label htmlFor="extras_allowed">Extras Allowed</Label>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <Label>Allergens</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Add allergen"
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addToArray("allergens", newAllergen, setNewAllergen))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addToArray("allergens", newAllergen, setNewAllergen)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.allergens.map((allergen, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{allergen}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray("allergens", index)} />
                </Badge>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Drink Pricing */}
          <div>
            <Label>Pricing (R)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {["glass", "shot", "bottle", "jug"].map((variant) => (
                <div key={variant}>
                  <Label htmlFor={variant} className="text-sm capitalize">
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
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tasting Notes */}
          <div>
            <Label>Tasting Notes</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Add tasting note"
                value={newTastingNote}
                onChange={(e) => setNewTastingNote(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addToArray("tasting_notes", newTastingNote, setNewTastingNote))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addToArray("tasting_notes", newTastingNote, setNewTastingNote)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tasting_notes.map((note, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{note}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray("tasting_notes", index)} />
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Ingredients */}
      <div>
        <Label>Ingredients</Label>
        <div className="flex space-x-2 mb-2">
          <Input
            placeholder="Add ingredient"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addToArray("ingredients", newIngredient, setNewIngredient))
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addToArray("ingredients", newIngredient, setNewIngredient)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.ingredients.map((ingredient, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{ingredient}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray("ingredients", index)} />
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex space-x-4 pt-4">
        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          {loading ? "Saving..." : item ? "Update Item" : "Create Item"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
