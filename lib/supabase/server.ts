import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "UNDEFINED")
  console.log("[v0] Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "UNDEFINED")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Missing Supabase environment variables:")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "SET" : "UNDEFINED")
    throw new Error("Supabase environment variables are not properly configured. Please check your Project Settings.")
  }

  return createSupabaseServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export const createServerClient = createClient
