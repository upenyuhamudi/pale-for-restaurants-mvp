"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface WaiterNameModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (waiterName: string) => void
  orderDetails: {
    id: string
    dinerName: string
    tableNumber: string
  } | null
}

export function WaiterNameModal({ isOpen, onClose, onConfirm, orderDetails }: WaiterNameModalProps) {
  const [waiterName, setWaiterName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    console.log("[v0] Waiter modal state changed:", { isOpen, orderDetails })
  }, [isOpen, orderDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!waiterName.trim()) return

    console.log("[v0] Submitting waiter name:", waiterName.trim())
    setIsSubmitting(true)
    try {
      await onConfirm(waiterName.trim())
      setWaiterName("")
      onClose()
    } catch (error) {
      console.error("Error confirming order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setWaiterName("")
    onClose()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Assign Waiter to Order</h2>
          <Button variant="outline" size="sm" onClick={handleClose} className="h-8 w-8 p-0 bg-transparent">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Table:</span> {orderDetails.tableNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Diner:</span> {orderDetails.dinerName}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="waiterName" className="text-sm font-medium">
              Waiter Name
            </label>
            <Input
              id="waiterName"
              type="text"
              placeholder="Enter waiter name"
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!waiterName.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Confirming..." : "Confirm Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
