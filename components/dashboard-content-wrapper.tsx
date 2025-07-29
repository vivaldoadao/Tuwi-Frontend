"use client"

import * as React from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
// import { useAuth } from "@/context/auth-context" // Not used

interface DashboardContentWrapperProps {
  children: React.ReactNode
}

export function DashboardContentWrapper({ children }: DashboardContentWrapperProps) {
  return (
    <SidebarInset className="relative flex min-h-svh flex-1 flex-col bg-background w-full max-w-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white text-gray-900">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-bold text-brand-primary">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {}} className="text-red-500 hover:bg-red-100">
            Sair
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50 w-full max-w-full">{children}</div>
    </SidebarInset>
  )
}
