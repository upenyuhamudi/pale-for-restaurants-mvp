import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Client Supabase URL:", supabaseUrl ? "SET" : "UNDEFINED")
  console.log("[v0] Client Supabase Key:", supabaseKey ? "SET" : "UNDEFINED")

  if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Missing client-side Supabase environment variables:")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "SET" : "UNDEFINED")
    throw new Error(
      "Supabase environment variables are not properly configured for client-side usage. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your Project Settings.",
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
