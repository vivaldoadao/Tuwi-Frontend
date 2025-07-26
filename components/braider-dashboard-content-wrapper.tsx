"use client"

import type * as React from "react"
import { SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

interface BraiderDashboardContentWrapperProps {
  children: React.ReactNode
}

export function BraiderDashboardContentWrapper({ children }: BraiderDashboardContentWrapperProps) {
  const { toggleSidebar } = useSidebar()
  // const { logout } = useAuth() // Not available in AuthContext

  return (
    <SidebarInset className="relative flex min-h-svh flex-1 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white text-gray-900">
        <SidebarTrigger className="-ml-1" onClick={toggleSidebar}>
          <PanelLeft className="h-6 w-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </SidebarTrigger>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-bold text-brand-primary">Painel da Trancista</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {}} className="text-red-500 hover:bg-red-100">
            Sair
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">{children}</div>
    </SidebarInset>
  )
}
