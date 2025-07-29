import type React from "react"
import { cookies } from "next/headers" // Importar cookies para leitura no servidor
import { DashboardClientLayout } from "@/components/dashboard-client-layout" // Importar o novo componente cliente

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Ler o estado do sidebar do cookie no servidor
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value !== "false" // Padrão true se não existe cookie

  return <DashboardClientLayout defaultSidebarOpen={defaultOpen}>{children}</DashboardClientLayout>
}
