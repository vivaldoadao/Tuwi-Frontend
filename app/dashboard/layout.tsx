import type React from "react"
import { ModernDashboardLayout } from "@/components/layouts/modern-dashboard-layout"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModernDashboardLayout userRole="admin">
      {children}
    </ModernDashboardLayout>
  )
}
