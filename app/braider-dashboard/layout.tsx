import type React from "react"
import { cookies } from "next/headers"
import { BraiderDashboardClientLayout } from "@/components/braider-dashboard-client-layout"
import { getBraiderById } from "@/lib/data" // Para obter o braider logado se tivéssemos auth real

export default async function BraiderDashboardLayout({ children }: { children: React.ReactNode }) {
  // Simular que o braider-1 está logado para o dashboard
  // Em uma aplicação real, você buscaria o ID do braider logado via autenticação
  const braiderId = "braider-1"
  const braider = getBraiderById(braiderId)

  // Ler o estado do sidebar do cookie no servidor
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  // Se o braider não for encontrado (na simulação), ou não estiver autenticado em um cenário real
  if (!braider) {
    // Redirecionaria para login ou mostraria uma mensagem de erro
    // Por simplicidade, para este exemplo, retornaremos null
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-brand-primary">
        Acesso negado. Por favor, faça login como trancista.
      </div>
    )
  }

  return (
    <BraiderDashboardClientLayout defaultSidebarOpen={defaultOpen} braider={braider}>
      {children}
    </BraiderDashboardClientLayout>
  )
}
