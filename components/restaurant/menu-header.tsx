"use client"

import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

interface Restaurant {
  id: string
  name: string
  logo_url: string | null
  header_image: string | null
  category: string | null
  location: string | null
}

interface Category {
  id: string
  name: string
}

interface FilterState {
  categories: string[]
  priceRange: [number, number]
  dietaryCategory: string
}

interface MenuHeaderProps {
  restaurant: Restaurant
  tableNumber?: string
  dinerName?: string
  onEditTable: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  categories: Category[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  maxPrice: number
}

export function MenuHeader({
  restaurant,
  tableNumber,
  dinerName,
  onEditTable,
  searchQuery,
  onSearchChange,
  categories,
  filters,
  onFiltersChange,
  maxPrice,
}: MenuHeaderProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice ||
    filters.dietaryCategory !== "all"

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: [0, maxPrice],
      dietaryCategory: "all",
    })
  }

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId]

    onFiltersChange({
      ...filters,
      categories: newCategories,
    })
  }

  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`space-y-6 ${isMobile ? "p-6" : ""}`}>
      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Categories</h4>
        <div className="grid grid-cols-1 gap-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-sm font-medium">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Price Range</h4>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                priceRange: value as [number, number],
              })
            }
            max={maxPrice}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">R</span>
            <Input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => {
                const newMin = Math.max(0, Math.min(Number(e.target.value) || 0, filters.priceRange[1] - 1))
                onFiltersChange({
                  ...filters,
                  priceRange: [newMin, filters.priceRange[1]],
                })
              }}
              className="w-16 h-8 text-xs text-center border-muted-foreground/20"
              min={0}
              max={filters.priceRange[1] - 1}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">R</span>
            <Input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => {
                const newMax = Math.min(
                  maxPrice,
                  Math.max(Number(e.target.value) || maxPrice, filters.priceRange[0] + 1),
                )
                onFiltersChange({
                  ...filters,
                  priceRange: [filters.priceRange[0], newMax],
                })
              }}
              className="w-16 h-8 text-xs text-center border-muted-foreground/20"
              min={filters.priceRange[0] + 1}
              max={maxPrice}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Dietary Category */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Dietary Preferences</h4>
        <Select
          value={filters.dietaryCategory}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              dietaryCategory: value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select dietary preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="Vegetarian">Vegetarian</SelectItem>
            <SelectItem value="Vegan">Vegan</SelectItem>
            <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
            <SelectItem value="Gluten-Free">Gluten-Free</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters button for mobile */}
      {isMobile && hasActiveFilters && (
        <Button
          variant="outline"
          onClick={() => {
            clearFilters()
            setMobileFilterOpen(false)
          }}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  )

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b sticky top-0 z-40 shadow-sm">
      {/* Restaurant cover image with gradient overlay */}
      {restaurant.header_image && (
        <div className="h-32 md:h-40 relative overflow-hidden">
          <img
            src={restaurant.header_image || "/placeholder.svg"}
            alt={`${restaurant.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Restaurant logo with better mobile sizing */}
          {restaurant.logo_url && (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 border-background shadow-md flex-shrink-0 bg-white">
              <img
                src={restaurant.logo_url || "/placeholder.svg"}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
            <h1 className="text-base md:text-xl font-bold text-foreground leading-tight">{restaurant.name}</h1>
            <div className="flex items-center gap-2">
              {restaurant.category && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 px-2 py-1">
                  {restaurant.category}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {tableNumber && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditTable}
                className="bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] px-3 py-2 text-xs md:text-sm"
              >
                <span className="hidden sm:inline">Table </span>
                {tableNumber}
                {dinerName && <span className="ml-1 text-muted-foreground hidden md:inline">• {dinerName}</span>}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Search input with proper mobile sizing */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors min-h-[44px] text-sm"
            />
          </div>

          {/* Filter controls with mobile-first design */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="md:hidden">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/30 min-h-[44px] px-4 py-2">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-4 w-4 p-0 text-xs bg-primary text-primary-foreground"
                      >
                        •
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-0">
                  <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle>Filter Menu</SheetTitle>
                  </SheetHeader>
                  <div className="p-6">
                    <FilterContent isMobile={true} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop filters with proper spacing */}
            <div className="hidden md:flex items-center gap-3 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/30 min-h-[44px]">
                    <Filter className="w-4 h-4 mr-2" />
                    Categories
                    {filters.categories.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
                        {filters.categories.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-6" align="start">
                  <FilterContent />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/30 min-h-[44px]">
                    Price Range
                    {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                      <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
                        •
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-6" align="start">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Price Range</h4>
                    <div className="px-2">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) =>
                          onFiltersChange({
                            ...filters,
                            priceRange: value as [number, number],
                          })
                        }
                        max={maxPrice}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">R</span>
                        <Input
                          type="number"
                          value={filters.priceRange[0]}
                          onChange={(e) => {
                            const newMin = Math.max(0, Math.min(Number(e.target.value) || 0, filters.priceRange[1] - 1))
                            onFiltersChange({
                              ...filters,
                              priceRange: [newMin, filters.priceRange[1]],
                            })
                          }}
                          className="w-16 h-8 text-xs text-center border-muted-foreground/20"
                          min={0}
                          max={filters.priceRange[1] - 1}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">R</span>
                        <Input
                          type="number"
                          value={filters.priceRange[1]}
                          onChange={(e) => {
                            const newMax = Math.min(
                              maxPrice,
                              Math.max(Number(e.target.value) || maxPrice, filters.priceRange[0] + 1),
                            )
                            onFiltersChange({
                              ...filters,
                              priceRange: [filters.priceRange[0], newMax],
                            })
                          }}
                          className="w-16 h-8 text-xs text-center border-muted-foreground/20"
                          min={filters.priceRange[0] + 1}
                          max={maxPrice}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Select
                value={filters.dietaryCategory}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    dietaryCategory: value,
                  })
                }
              >
                <SelectTrigger className="w-auto bg-muted/30 border-muted-foreground/20 min-h-[44px]">
                  <SelectValue placeholder="Dietary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="Vegan">Vegan</SelectItem>
                  <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                  <SelectItem value="Gluten-Free">Gluten-Free</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground min-h-[44px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badges with proper mobile spacing */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.categories.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId)
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="text-xs bg-primary/10 text-primary px-2 py-1">
                    {category.name}
                    <button
                      onClick={() => toggleCategory(categoryId)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 min-w-[16px] min-h-[16px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null
              })}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary px-2 py-1">
                  R{filters.priceRange[0]} - R{filters.priceRange[1]}
                </Badge>
              )}
              {filters.dietaryCategory !== "all" && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary px-2 py-1">
                  {filters.dietaryCategory}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
