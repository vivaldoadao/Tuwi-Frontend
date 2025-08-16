import { allBraiders } from "@/lib/data"
import type { Braider } from "@/lib/data"

export interface BraiderStatus {
  isBraider: boolean
  status?: "pending" | "approved" | "rejected"
  braider?: Braider
}

/**
 * Verifica se um usuário é trancista baseado no email
 * @param userEmail - Email do usuário logado
 * @returns Objeto com status do trancista
 */
export function checkBraiderStatus(userEmail: string): BraiderStatus {
  if (!userEmail) {
    return { isBraider: false }
  }

  // Buscar trancista pelo email de contato
  const braider = allBraiders.find(b => b.contactEmail === userEmail)
  
  if (!braider) {
    return { isBraider: false }
  }

  return {
    isBraider: true,
    status: braider.status,
    braider
  }
}

/**
 * Verifica se o usuário pode se registrar como trancista
 * @param userEmail - Email do usuário logado
 * @returns true se pode se registrar, false caso contrário
 */
export function canRegisterAsBraider(userEmail: string): boolean {
  const status = checkBraiderStatus(userEmail)
  
  // Pode se registrar se não for trancista ou se foi rejeitado
  return !status.isBraider || status.status === "rejected"
}

/**
 * Obtém mensagem personalizada baseada no status do trancista
 * @param status - Status do trancista
 * @param braiderName - Nome da trancista
 * @returns Mensagem personalizada
 */
export function getBraiderStatusMessage(
  status: "pending" | "approved" | "rejected",
  braiderName?: string
): string {
  const name = braiderName ? `, ${braiderName}` : ""
  
  switch (status) {
    case "approved":
      return `Olá${name}! Você já é uma trancista aprovada na nossa plataforma.`
    case "pending":
      return `Olá${name}! Sua solicitação para ser trancista está sendo analisada.`
    case "rejected":
      return `Olá${name}! Sua solicitação anterior foi rejeitada, mas você pode tentar novamente.`
    default:
      return "Status desconhecido."
  }
}

/**
 * Obtém a próxima ação recomendada para o usuário
 * @param status - Status do trancista
 * @returns Ação recomendada
 */
export function getRecommendedAction(status: "pending" | "approved" | "rejected"): {
  label: string
  href: string
  description: string
} {
  switch (status) {
    case "approved":
      return {
        label: "Acessar Dashboard",
        href: "/dashboard/braider",
        description: "Gerencie seus serviços e agendamentos"
      }
    case "pending":
      return {
        label: "Ver Status",
        href: "/profile/braider-status",
        description: "Acompanhe o progresso da sua solicitação"
      }
    case "rejected":
      return {
        label: "Nova Solicitação",
        href: "/register-braider?reapply=true",
        description: "Corrija as informações e tente novamente"
      }
  }
}

/**
 * Valida se os dados do usuário logado são suficientes para pré-preenchimento
 * @param user - Dados do usuário da sessão
 * @returns Dados validados para pré-preenchimento
 */
export function getPrefilledData(user: any) {
  return {
    name: user?.name || "",
    contactEmail: user?.email || "",
    profileImageUrl: user?.image || user?.avatar_url || ""
  }
}