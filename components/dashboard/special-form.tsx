"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SpecialFormProps {
  restaurantId: string
  special?: any
  onSave: () => void
  onCancel: () => void
}

export function SpecialForm({ restaurantId, special, onSave, onCancel }: SpecialFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: special?.name || "",
    description: special?.description || "",
    special_type: special?.special_type || "discount",
    original_price: special?.original_price || { amount: "", currency: "ZAR" },
    special_price: special?.special_price || { amount: "", currency: "ZAR" },
    discount_percentage: special?.discount_percentage || "",
    start_date: special?.start_date || "",
    end_date: special?.end_date || "",
    start_time: special?.start_time || "",
    end_time: special?.end_time || "",
    days_of_week: special?.days_of_week || {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    max_redemptions: special?.max_redemptions || "",
    current_redemptions: special?.current_redemptions || 0,
    availability_status: special?.availability_status || "available",
    is_featured: special?.is_featured || false,
    image_url: special?.image_url || "",
    terms_and_conditions: special?.terms_and_conditions || "",
  })

  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const steps = [
    { number: 1, title: "Special Details" },
    { number: 2, title: "Pricing" },
    { number: 3, title: "Schedule" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data: any = {
        restaurant_id: restaurantId,
        name: formData.name,
        description: formData.description,
        special_type: formData.special_type,
        original_price: formData.original_price.amount ? formData.original_price : null,
        special_price: formData.special_price.amount ? formData.special_price : null,
        discount_percentage: formData.discount_percentage ? Number.parseInt(formData.discount_percentage) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        days_of_week: formData.days_of_week,
        max_redemptions: formData.max_redemptions ? Number.parseInt(formData.max_redemptions) : null,
        current_redemptions: formData.current_redemptions,
        availability_status: formData.availability_status,
        is_featured: formData.is_featured,
        image_url: formData.image_url || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        updated_at: new Date().toISOString(),
      }

      let result
      if (special) {
        result = await supabase.from("specials").update(data).eq("id", special.id)
      } else {
        data.id = `special_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        data.created_at = new Date().toISOString()
        result = await supabase.from("specials").insert(data)
      }

      if (result.error) throw result.error

      onSave()
    } catch (error) {
      console.error("[v0] Error saving special:", error)
      alert("Error saving special. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleDayOfWeek = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: {
        ...prev.days_of_week,
        [day]: !prev.days_of_week[day as keyof typeof prev.days_of_week],
      },
    }))
  }

  const daysOfWeek = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ]

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.name.trim() !== ""
    }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.number ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.number}
            </div>
            <span className={`ml-2 text-sm ${currentStep >= step.number ? "text-orange-600" : "text-gray-500"}`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? "bg-orange-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Special Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="py-2.5" htmlFor="name">
                  Special Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label className="py-2.5" htmlFor="special_type">
                  Special Type
                </Label>
                <Select
                  value={formData.special_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, special_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="bogo">Buy One Get One</SelectItem>
                    <SelectItem value="combo">Combo Deal</SelectItem>
                    <SelectItem value="happy_hour">Happy Hour</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="is_featured">Featured Special</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/special-image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData((prev) => ({ ...prev, terms_and_conditions: e.target.value }))}
                rows={3}
                placeholder="Enter any terms and conditions for this special..."
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing (Optional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="original_price">Original Price (R)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      original_price: { ...prev.original_price, amount: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="special_price">Special Price (R)</Label>
                <Input
                  id="special_price"
                  type="number"
                  step="0.01"
                  value={formData.special_price.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      special_price: { ...prev.special_price, amount: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="discount_percentage">Discount %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discount_percentage: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="max_redemptions">Max Redemptions</Label>
              <Input
                id="max_redemptions"
                type="number"
                min="1"
                value={formData.max_redemptions}
                onChange={(e) => setFormData((prev) => ({ ...prev, max_redemptions: e.target.value }))}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Schedule</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map(({ key, label }) => (
                  <Button
                    key={key}
                    type="button"
                    variant={formData.days_of_week[key as keyof typeof formData.days_of_week] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDayOfWeek(key)}
                    className="h-8 w-12"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? "Saving..." : special ? "Update Special" : "Create Special"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
