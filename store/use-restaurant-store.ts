import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface Restaurant {
  id: string
  name: string
  logo_url: string | null
  header_image: string | null
  category: string | null
  about: string | null
  location: string | null
  video_url: string | null
  hidden: boolean | null
}

interface Category {
  id: string
  restaurant_id: string
  name: string
  description: string | null
}

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

interface CartItem {
  id: string
  type: "meal" | "drink"
  item: Meal | Drink
  quantity: number
  selectedExtras?: string[]
  selectedSides?: string[]
  preferences?: string[]
}

interface RestaurantStore {
  // Data
  currentRestaurant: Restaurant | null
  categories: Category[]
  meals: Meal[]
  drinks: Drink[]
  cart: CartItem[]
  tableNumber: string | null

  // Loading states
  isLoading: boolean

  // Actions
  setCurrentRestaurant: (restaurant: Restaurant | null) => void
  setCategories: (categories: Category[]) => void
  setMeals: (meals: Meal[]) => void
  setDrinks: (drinks: Drink[]) => void
  setLoading: (loading: boolean) => void
  setTableNumber: (tableNumber: string | null) => void

  // Cart actions
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateCartItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void

  // Computed
  cartTotal: () => number
  cartItemCount: () => number
}

export const useRestaurantStore = create<RestaurantStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentRestaurant: null,
        categories: [],
        meals: [],
        drinks: [],
        cart: [],
        tableNumber: null,
        isLoading: false,

        // Actions
        setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }, false, "setCurrentRestaurant"),

        setCategories: (categories) => set({ categories }, false, "setCategories"),

        setMeals: (meals) => set({ meals }, false, "setMeals"),

        setDrinks: (drinks) => set({ drinks }, false, "setDrinks"),

        setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),

        setTableNumber: (tableNumber) => set({ tableNumber }, false, "setTableNumber"),

        // Cart actions
        addToCart: (newItem) =>
          set(
            (state) => {
              const existingItemIndex = state.cart.findIndex(
                (item) =>
                  item.id === newItem.id &&
                  JSON.stringify(item.selectedExtras) === JSON.stringify(newItem.selectedExtras) &&
                  JSON.stringify(item.selectedSides) === JSON.stringify(newItem.selectedSides),
              )

              if (existingItemIndex >= 0) {
                const updatedCart = [...state.cart]
                updatedCart[existingItemIndex].quantity += newItem.quantity
                return { cart: updatedCart }
              } else {
                return { cart: [...state.cart, { ...newItem, id: `${newItem.id}-${Date.now()}` }] }
              }
            },
            false,
            "addToCart",
          ),

        removeFromCart: (itemId) =>
          set(
            (state) => ({
              cart: state.cart.filter((item) => item.id !== itemId),
            }),
            false,
            "removeFromCart",
          ),

        updateCartItemQuantity: (itemId, quantity) =>
          set(
            (state) => ({
              cart:
                quantity <= 0
                  ? state.cart.filter((item) => item.id !== itemId)
                  : state.cart.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
            }),
            false,
            "updateCartItemQuantity",
          ),

        clearCart: () => set({ cart: [] }, false, "clearCart"),

        // Computed values
        cartTotal: () => {
          const { cart } = get()
          return cart.reduce((total, item) => {
            const price = "price" in item.item ? item.item.price || 0 : 0
            return total + price * item.quantity
          }, 0)
        },

        cartItemCount: () => {
          const { cart } = get()
          return cart.reduce((count, item) => count + item.quantity, 0)
        },
      }),
      {
        name: "restaurant-store",
        partialize: (state) => ({
          cart: state.cart,
          currentRestaurant: state.currentRestaurant,
          tableNumber: state.tableNumber,
        }),
      },
    ),
    {
      name: "restaurant-store",
    },
  ),
)
