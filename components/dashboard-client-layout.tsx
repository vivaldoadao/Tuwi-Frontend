"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardContentWrapper } from "@/components/dashboard-content-wrapper"

interface DashboardClientLayoutProps {
  children: React.ReactNode
  defaultSidebarOpen: boolean // Prop para receber o estado inicial do sidebar
}

export function DashboardClientLayout({ children, defaultSidebarOpen }: DashboardClientLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-brand-primary">
        Carregando dashboard...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <DashboardSidebar />
      <DashboardContentWrapper>{children}</DashboardContentWrapper>
    </SidebarProvider>
  )
}
