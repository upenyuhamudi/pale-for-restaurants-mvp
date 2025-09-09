import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type MealLine = {
  type: "meal"
  id: string
  name: string
  unitPrice: number
  quantity: number
  sideIds: string[]
  extraIds: string[]
  preferences?: Record<string, string>
}

export type DrinkLine = {
  type: "drink"
  id: string
  name: string
  variant: "glass" | "jug" | "shot" | "bottle"
  unitPrice: number
  quantity: number
}

export type CartLine = MealLine | DrinkLine

interface CartState {
  cart: {
    lines: CartLine[]
    table_number?: string
    restaurant_id?: string
    diner_name?: string // Added diner_name field for order placement
  }
  pairingSuggestion: {
    isOpen: boolean
    addedItem: {
      type: "meal" | "drink"
      id: string
      name: string
    } | null
  }
}

interface CartActions {
  setTableNumber: (table: string) => void
  setRestaurant: (restaurantId: string) => void
  setDinerName: (name: string) => void // Added setDinerName action
  addMealLine: (payload: Omit<MealLine, "type">, skipPairingSuggestion?: boolean) => void
  addDrinkLine: (payload: Omit<DrinkLine, "type">, skipPairingSuggestion?: boolean) => void
  removeLine: (index: number) => void
  updateLineQuantity: (index: number, quantity: number) => void
  incrementLineQuantity: (index: number) => void
  decrementLineQuantity: (index: number) => void
  clear: () => void
  clearCart: () => void // Added clearCart alias for consistency with cart components
  clearCartItems: () => void // Added clearCartItems to preserve diner info
  getCartTotal: () => number
  getCartItemCount: () => number
  validateRestaurant: (currentRestaurantId: string) => boolean
  showPairingSuggestion: (item: { type: "meal" | "drink"; id: string; name: string }) => void
  hidePairingSuggestion: () => void
}

type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cart: {
          lines: [],
          table_number: undefined,
          restaurant_id: undefined,
          diner_name: undefined, // Added diner_name to initial state
        },
        pairingSuggestion: {
          isOpen: false,
          addedItem: null,
        },

        // Actions
        setTableNumber: (table) => {
          console.log("[v0] Cart store setTableNumber called:", table)
          set(
            (state) => {
              console.log("[v0] Cart store state before setTableNumber:", state.cart)
              const newState = {
                cart: { ...state.cart, table_number: table },
              }
              console.log("[v0] Cart store state after setTableNumber:", newState.cart)
              return newState
            },
            false,
            "setTableNumber",
          )
        },

        setRestaurant: (restaurantId) => {
          console.log("[v0] Cart store setRestaurant called:", restaurantId)
          set(
            (state) => ({
              cart: { ...state.cart, restaurant_id: restaurantId },
            }),
            false,
            "setRestaurant",
          )
        },

        setDinerName: (name) => {
          console.log("[v0] Cart store setDinerName called:", name)
          set(
            (state) => {
              console.log("[v0] Cart store state before setDinerName:", state.cart)
              const newState = {
                cart: { ...state.cart, diner_name: name },
              }
              console.log("[v0] Cart store state after setDinerName:", newState.cart)
              return newState
            },
            false,
            "setDinerName",
          )
        },

        addMealLine: (payload, skipPairingSuggestion = false) =>
          set(
            (state) => {
              // Check if identical meal line exists (same id, sides, extras, preferences)
              const existingIndex = state.cart.lines.findIndex(
                (line) =>
                  line.type === "meal" &&
                  line.id === payload.id &&
                  JSON.stringify(line.sideIds.sort()) === JSON.stringify(payload.sideIds.sort()) &&
                  JSON.stringify(line.extraIds.sort()) === JSON.stringify(payload.extraIds.sort()) &&
                  JSON.stringify(line.preferences) === JSON.stringify(payload.preferences),
              )

              const newLines = [...state.cart.lines]
              let shouldShowPairing = false

              if (existingIndex >= 0) {
                // Update existing line quantity
                const existingLine = newLines[existingIndex] as MealLine
                newLines[existingIndex] = {
                  ...existingLine,
                  quantity: existingLine.quantity + payload.quantity,
                }
              } else {
                // Add new line
                newLines.push({ ...payload, type: "meal" })
                shouldShowPairing = !skipPairingSuggestion
              }

              return {
                cart: { ...state.cart, lines: newLines },
                pairingSuggestion: shouldShowPairing
                  ? {
                      isOpen: true,
                      addedItem: { type: "meal", id: payload.id, name: payload.name },
                    }
                  : state.pairingSuggestion,
              }
            },
            false,
            "addMealLine",
          ),

        addDrinkLine: (payload, skipPairingSuggestion = false) =>
          set(
            (state) => {
              // Check if identical drink line exists (same id and variant)
              const existingIndex = state.cart.lines.findIndex(
                (line) => line.type === "drink" && line.id === payload.id && line.variant === payload.variant,
              )

              const newLines = [...state.cart.lines]
              let shouldShowPairing = false

              if (existingIndex >= 0) {
                // Update existing line quantity
                const existingLine = newLines[existingIndex] as DrinkLine
                newLines[existingIndex] = {
                  ...existingLine,
                  quantity: existingLine.quantity + payload.quantity,
                }
              } else {
                // Add new line
                newLines.push({ ...payload, type: "drink" })
                shouldShowPairing = !skipPairingSuggestion
              }

              return {
                cart: { ...state.cart, lines: newLines },
                pairingSuggestion: shouldShowPairing
                  ? {
                      isOpen: true,
                      addedItem: { type: "drink", id: payload.id, name: payload.name },
                    }
                  : state.pairingSuggestion,
              }
            },
            false,
            "addDrinkLine",
          ),

        removeLine: (index) =>
          set(
            (state) => ({
              cart: {
                ...state.cart,
                lines: state.cart.lines.filter((_, i) => i !== index),
              },
            }),
            false,
            "removeLine",
          ),

        updateLineQuantity: (index, quantity) =>
          set(
            (state) => {
              if (quantity <= 0) return state
              const newLines = [...state.cart.lines]
              if (newLines[index]) {
                newLines[index] = { ...newLines[index], quantity }
              }
              return {
                cart: { ...state.cart, lines: newLines },
              }
            },
            false,
            "updateLineQuantity",
          ),

        incrementLineQuantity: (index) =>
          set(
            (state) => {
              const newLines = [...state.cart.lines]
              if (newLines[index]) {
                newLines[index] = { ...newLines[index], quantity: newLines[index].quantity + 1 }
              }
              return {
                cart: { ...state.cart, lines: newLines },
              }
            },
            false,
            "incrementLineQuantity",
          ),

        decrementLineQuantity: (index) =>
          set(
            (state) => {
              const newLines = [...state.cart.lines]
              if (newLines[index] && newLines[index].quantity > 1) {
                newLines[index] = { ...newLines[index], quantity: newLines[index].quantity - 1 }
              }
              return {
                cart: { ...state.cart, lines: newLines },
              }
            },
            false,
            "decrementLineQuantity",
          ),

        clear: () =>
          set(
            {
              cart: {
                lines: [],
                table_number: undefined,
                restaurant_id: undefined,
                diner_name: undefined, // Clear diner_name as well
              },
              pairingSuggestion: {
                isOpen: false,
                addedItem: null,
              },
            },
            false,
            "clear",
          ),

        clearCart: () => {
          const { clear } = get()
          clear()
        },

        clearCartItems: () =>
          set(
            (state) => ({
              cart: {
                ...state.cart,
                lines: [], // Only clear the cart lines
                // Preserve table_number, restaurant_id, and diner_name for continued ordering
              },
              pairingSuggestion: {
                isOpen: false,
                addedItem: null,
              },
            }),
            false,
            "clearCartItems",
          ),

        // Computed values
        getCartTotal: () => {
          const { cart } = get()
          return cart.lines.reduce((total, line) => {
            const unitPrice = typeof line.unitPrice === "number" && !isNaN(line.unitPrice) ? line.unitPrice : 0
            return total + unitPrice * line.quantity
          }, 0)
        },

        getCartItemCount: () => {
          const { cart } = get()
          return cart.lines.reduce((count, line) => count + line.quantity, 0)
        },

        // Validation
        validateRestaurant: (currentRestaurantId) => {
          const { cart } = get()
          return !cart.restaurant_id || cart.restaurant_id === currentRestaurantId
        },

        // Pairing suggestion actions
        showPairingSuggestion: (item) =>
          set(
            {
              pairingSuggestion: {
                isOpen: true,
                addedItem: item,
              },
            },
            false,
            "showPairingSuggestion",
          ),

        hidePairingSuggestion: () =>
          set(
            {
              pairingSuggestion: {
                isOpen: false,
                addedItem: null,
              },
            },
            false,
            "hidePairingSuggestion",
          ),
      }),
      {
        name: "cart-store",
        partialize: (state) => ({
          cart: state.cart,
        }),
      },
    ),
    {
      name: "cart-store",
    },
  ),
)
