"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/django-auth-context'
import { toast } from 'react-hot-toast'

/**
 * Hook para proteger páginas que requerem acesso de administrador
 * Redireciona automaticamente se o usuário não for admin ou não estiver logado
 */
export function useAdminGuard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Aguardar carregamento da autenticação
    if (isLoading) return

    // Se não estiver logado, redirecionar para login
    if (!isAuthenticated) {
      toast.error('Acesso negado. Faça login para continuar.')
      router.push('/login')
      return
    }

    // Se estiver logado mas não for admin, redirecionar para dashboard
    if (user && user.role !== 'admin') {
      toast.error('Acesso negado. Esta página é restrita a administradores.')
      router.push('/dashboard')
      return
    }
  }, [user, isAuthenticated, isLoading, router])

  return {
    isAdmin: user?.role === 'admin',
    isLoading,
    isAuthenticated,
    user
  }
}

/**
 * Hook para verificar roles específicos
 */
export function useRoleGuard(requiredRoles: string[]) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Aguardar carregamento da autenticação
    if (isLoading) return

    // Se não estiver logado, redirecionar para login
    if (!isAuthenticated) {
      toast.error('Acesso negado. Faça login para continuar.')
      router.push('/login')
      return
    }

    // Se estiver logado mas não tiver o role necessário
    if (user && !requiredRoles.includes(user.role)) {
      toast.error(`Acesso negado. Esta página requer um dos seguintes roles: ${requiredRoles.join(', ')}`)
      router.push('/dashboard')
      return
    }
  }, [user, isAuthenticated, isLoading, requiredRoles, router])

  return {
    hasRequiredRole: user ? requiredRoles.includes(user.role) : false,
    isLoading,
    isAuthenticated,
    user
  }
}