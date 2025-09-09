export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          header_image: string | null
          category: string | null
          about: string | null
          location: string | null
          video_url: string | null
          hidden: boolean | null
          socials: any | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          header_image?: string | null
          category?: string | null
          about?: string | null
          location?: string | null
          video_url?: string | null
          hidden?: boolean | null
          socials?: any | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          header_image?: string | null
          category?: string | null
          about?: string | null
          location?: string | null
          video_url?: string | null
          hidden?: boolean | null
          socials?: any | null
        }
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          description?: string | null
        }
      }
      meals: {
        Row: {
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
        Insert: {
          id?: string
          restaurant_id: string
          category_id?: string | null
          name: string
          dietary_category?: string | null
          description?: string | null
          ingredients?: string[] | null
          allergens?: string[] | null
          image_url?: string | null
          price?: number | null
          availability_status?: string | null
          extras_allowed?: boolean | null
          extra_choices?: string[] | null
          preferences?: string[] | null
          pairings_drinks?: string[] | null
          side_choices?: string[] | null
          allowed_extras?: number | null
          preference_options?: any | null
          allowed_sides?: number | null
          dipping_sauces_included?: boolean | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string | null
          name?: string
          dietary_category?: string | null
          description?: string | null
          ingredients?: string[] | null
          allergens?: string[] | null
          image_url?: string | null
          price?: number | null
          availability_status?: string | null
          extras_allowed?: boolean | null
          extra_choices?: string[] | null
          preferences?: string[] | null
          pairings_drinks?: string[] | null
          side_choices?: string[] | null
          allowed_extras?: number | null
          preference_options?: any | null
          allowed_sides?: number | null
          dipping_sauces_included?: boolean | null
        }
      }
      drinks: {
        Row: {
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
        Insert: {
          id?: string
          restaurant_id: string
          category_id?: string | null
          name: string
          description?: string | null
          image_url?: string | null
          ingredients?: string[] | null
          tasting_notes?: string[] | null
          availability_status?: string | null
          pricing?: any | null
          pairings_meals?: string[] | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          image_url?: string | null
          ingredients?: string[] | null
          tasting_notes?: string[] | null
          availability_status?: string | null
          pricing?: any | null
          pairings_meals?: string[] | null
        }
      }
    }
  }
}

export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"]
export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Meal = Database["public"]["Tables"]["meals"]["Row"]
export type Drink = Database["public"]["Tables"]["drinks"]["Row"]

export type RestaurantInsert = Database["public"]["Tables"]["restaurants"]["Insert"]
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"]
export type MealInsert = Database["public"]["Tables"]["meals"]["Insert"]
export type DrinkInsert = Database["public"]["Tables"]["drinks"]["Insert"]
