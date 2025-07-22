"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { BraiderDashboardSidebar } from "@/components/braider-dashboard-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { BraiderDashboardContentWrapper } from "@/components/braider-dashboard-content-wrapper" // Importar o novo wrapper
import type { Braider } from "@/lib/data"

interface BraiderDashboardClientLayoutProps {
  children: React.ReactNode
  defaultSidebarOpen: boolean
  braider: Braider
}

export function BraiderDashboardClientLayout({
  children,
  defaultSidebarOpen,
  braider,
}: BraiderDashboardClientLayoutProps) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-brand-primary">
        Carregando painel da trancista...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <BraiderDashboardSidebar braider={braider} />
      <BraiderDashboardContentWrapper>{children}</BraiderDashboardContentWrapper> {/* Usar o novo wrapper */}
    </SidebarProvider>
  )
}
