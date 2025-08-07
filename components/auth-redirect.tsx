"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getDefaultRedirectPath, isAdmin, isBraider } from "@/lib/roles"

interface AuthRedirectProps {
  /** Se deve executar o redirecionamento (padrão: true) */
  enabled?: boolean
  /** Página atual (para evitar loop de redirecionamento) */
  currentPath?: string
  /** Se deve mostrar logs de debug */
  debug?: boolean
}

/**
 * Componente para redirecionamento automático baseado na role do usuário
 * Deve ser usado após login bem-sucedido
 */
export function AuthRedirect({ enabled = true, currentPath, debug = false }: AuthRedirectProps) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!enabled || isLoading || !session?.user) return

    const userRole = session.user.role
    const currentUrl = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '')

    if (debug) {
      console.log("AuthRedirect - User role:", userRole)
      console.log("AuthRedirect - Current path:", currentUrl)
    }

    // Determinar o destino baseado na role
    let targetPath: string

    if (isAdmin(session)) {
      targetPath = "/dashboard"
    } else if (isBraider(session)) {
      targetPath = "/braider-dashboard"
    } else {
      // Customer - não redirecionar automaticamente, deixar na página atual
      return
    }

    // Só redirecionar se não estiver já na área correta
    if (!currentUrl.startsWith(targetPath)) {
      if (debug) {
        console.log("AuthRedirect - Redirecting to:", targetPath)
      }
      router.push(targetPath as any)
    }
  }, [session, isLoading, enabled, currentPath, debug, router])

  return null // Este componente não renderiza nada
}

/**
 * Hook para redirecionamento baseado na role
 */
export function useAuthRedirect(enabled = true) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  const redirectToRoleDashboard = () => {
    if (!session?.user) return

    if (isAdmin(session)) {
      router.push("/dashboard" as any)
    } else if (isBraider(session)) {
      router.push("/braider-dashboard" as any)
    } else {
      router.push("/" as any)
    }
  }

  return {
    redirectToRoleDashboard,
    userRole: session?.user?.role,
    isReady: !isLoading && !!session?.user
  }
}