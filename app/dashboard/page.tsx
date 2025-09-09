"use client"

export default function DashboardIndex() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Dashboard</h1>
        <p className="text-gray-600 mb-4">Please specify a restaurant ID in the URL</p>
        <p className="text-sm text-gray-500">Example: /dashboard/rest_mote</p>
      </div>
    </div>
  )
}
