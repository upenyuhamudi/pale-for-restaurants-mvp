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
    <div className={`space-y-4 md:space-y-6 ${isMobile ? "p-4 md:p-6" : ""}`}>
      {/* Categories */}
      <div className="space-y-2 md:space-y-3">
        <h4 className="font-medium text-sm">Categories</h4>
        <div className="grid grid-cols-1 gap-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-3 cursor-pointer min-h-[44px] py-2">
              <input
                type="checkbox"
                checked={filters.categories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange w-4 h-4"
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
            step={10}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>R{filters.priceRange[0]}</span>
          <span>R{filters.priceRange[1]}</span>
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
          className="w-full min-h-[44px]"
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
        <div className="h-24 md:h-32 lg:h-40 relative overflow-hidden">
          <img
            src={restaurant.header_image || "/placeholder.svg"}
            alt={`${restaurant.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-3 md:px-4 lg:px-6 py-3 md:py-4">
        <div className="flex items-start gap-3 mb-3 md:mb-4">
          {/* Restaurant logo with better styling */}
          {restaurant.logo_url && (
            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden border-2 border-background shadow-md flex-shrink-0 bg-white">
              <img
                src={restaurant.logo_url || "/placeholder.svg"}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg lg:text-xl font-bold text-foreground mb-1 leading-tight">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-2 mb-1">
              {restaurant.category && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {restaurant.category}
                </Badge>
              )}
            </div>
            {restaurant.location && (
              <p className="text-xs md:text-sm text-muted-foreground leading-tight">{restaurant.location}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {tableNumber && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditTable}
                className="bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] text-xs md:text-sm"
              >
                Table {tableNumber}
                {dinerName && <span className="ml-1 text-muted-foreground hidden md:inline">• {dinerName}</span>}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2 md:space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors min-h-[44px]"
            />
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="md:hidden">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/30 min-h-[44px]">
                    <Filter className="w-4 h-4 mr-1" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                        •
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Filter Menu</SheetTitle>
                  </SheetHeader>
                  <FilterContent isMobile={true} />
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:flex items-center gap-2 flex-wrap">
              {/* Category filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/30">
                    <Filter className="w-4 h-4 mr-1" />
                    Categories
                    {filters.categories.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                        {filters.categories.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <FilterContent />
                </PopoverContent>
              </Popover>

              {/* Price range filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/30">
                    Price Range
                    {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                        •
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
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
                        step={10}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>R{filters.priceRange[0]}</span>
                      <span>R{filters.priceRange[1]}</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Dietary category filter */}
              <Select
                value={filters.dietaryCategory}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    dietaryCategory: value,
                  })
                }
              >
                <SelectTrigger className="w-auto bg-muted/30 border-muted-foreground/20">
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

              {/* Clear filters button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1 flex-wrap">
              {filters.categories.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId)
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="text-xs bg-primary/10 text-primary">
                    {category.name}
                    <button
                      onClick={() => toggleCategory(categoryId)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null
              })}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                  R{filters.priceRange[0]} - R{filters.priceRange[1]}
                </Badge>
              )}
              {filters.dietaryCategory !== "all" && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
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
