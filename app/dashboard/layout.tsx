"use client"

import type React from "react"
import { ModernDashboardLayout } from "@/components/layouts/modern-dashboard-layout"
import { useAuth } from "@/context/django-auth-context"
import { useAdminGuard } from "@/hooks/use-admin-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Protect admin routes
  useAdminGuard()
  
  const { user } = useAuth()
  
  return (
    <ModernDashboardLayout userRole={user?.role || "admin"}>
      {children}
    </ModernDashboardLayout>
  )
}
