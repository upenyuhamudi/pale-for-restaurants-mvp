import type React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (numericAmount == null || isNaN(numericAmount)) {
    return "R0.00"
  }
  return `R${numericAmount.toFixed(2)}`
}

export function minDrinkPrice(pricing: Record<string, number | null>): number {
  const prices = Object.values(pricing).filter((price): price is number => price !== null)
  return Math.min(...prices)
}

export function resolveDrinkUnitPrice(pricing: Record<string, number | null>, variant: string): number {
  return pricing[variant] || 0
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url

  // Extract file ID from various Google Drive URL formats
  let fileId = null

  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    fileId = fileMatch[1]
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    fileId = openMatch[1]
  }

  // If we found a file ID, convert to thumbnail format
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`
  }

  // Return original URL if not a Google Drive link
  return url
}

export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>): void {
  const img = event.currentTarget
  const fallbackUrl = `/placeholder.svg?height=200&width=200&query=menu item`

  // Prevent infinite loop if placeholder also fails
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl
  }
}
