"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getDefaultRedirectPath, isBraider, isAdmin } from "@/lib/roles"

interface UseRoleRedirectOptions {
  enabled?: boolean
  fallback?: string
}

/**
 * Hook para redirecionamento automático baseado na role do usuário
 */
export function useRoleRedirect(options: UseRoleRedirectOptions = {}) {
  const { enabled = true, fallback = "/" } = options
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!enabled || isLoading) return

    if (session?.user) {
      // Obter o caminho padrão baseado na role
      const defaultPath = getDefaultRedirectPath(session)
      
      // Log para debug
      console.log("User role:", session.user.role)
      console.log("Default redirect path:", defaultPath)
      
      // Só redirecionar se não estiver já no caminho correto
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname
        
        // Se é braider, redirecionar para braider dashboard
        if (isBraider(session) && !currentPath.startsWith("/braider-dashboard")) {
          console.log("Redirecting braider to:", "/braider-dashboard")
          router.push("/braider-dashboard" as any)
          return
        }
        
        // Se é admin, redirecionar para admin dashboard
        if (isAdmin(session) && !currentPath.startsWith("/dashboard")) {
          console.log("Redirecting admin to:", "/dashboard")
          router.push("/dashboard" as any)
          return
        }
        
        // Para customer, não redirecionar automaticamente
      }
    } else if (!isLoading) {
      // Não há sessão, redirecionar para fallback
      router.push(fallback as any)
    }
  }, [session, isLoading, enabled, fallback, router])

  return {
    isRedirecting: isLoading,
    userRole: session?.user?.role
  }
}