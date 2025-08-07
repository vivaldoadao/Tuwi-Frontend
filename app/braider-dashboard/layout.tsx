"use client"

import type React from "react"
import { BraiderDashboardClientLayout } from "@/components/braider-dashboard-client-layout"
import { BraiderGuard } from "@/components/role-guard"
import { useAuth } from "@/context/auth-context"
import { getBraiderById } from "@/lib/data"
import { useState, useEffect } from "react"

export default function BraiderDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [braider, setBraider] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      // In a real app, we'd fetch braider profile by user ID
      // For now, use fallback or create mock based on user
      const braiderProfile = getBraiderById(user.id) || getBraiderById("braider-1") || {
        id: user.id,
        name: user.name || "Trancista",
        bio: "Bem-vinda ao seu dashboard",
        location: "Localização não definida",
        profileImageUrl: user.image || "/placeholder.svg?height=200&width=200&text=T",
        availability: {},
        ratings: [],
        reviews: [],
        specialties: [],
        contactEmail: user.email || "",
        contactPhone: "",
        services: []
      }
      setBraider(braiderProfile)
    }
    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <BraiderGuard redirectTo="/login">
      <BraiderDashboardClientLayout defaultSidebarOpen={true} braider={braider}>
        {children}
      </BraiderDashboardClientLayout>
    </BraiderGuard>
  )
}
