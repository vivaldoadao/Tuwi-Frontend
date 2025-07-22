import type React from "react"
import { cookies } from "next/headers" // Importar cookies para leitura no servidor
import { DashboardClientLayout } from "@/components/dashboard-client-layout" // Importar o novo componente cliente

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Ler o estado do sidebar do cookie no servidor
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return <DashboardClientLayout defaultSidebarOpen={defaultOpen}>{children}</DashboardClientLayout>
}
