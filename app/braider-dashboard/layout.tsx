import type React from "react"
import { ModernDashboardLayout } from "@/components/layouts/modern-dashboard-layout"
import { BraiderGuard } from "@/components/role-guard"

export default function BraiderDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BraiderGuard redirectTo="/login">
      <ModernDashboardLayout userRole="braider">
        {children}
      </ModernDashboardLayout>
    </BraiderGuard>
  )
}
