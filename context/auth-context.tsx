/**
 * Wrapper de compatibilidade para o contexto de autenticação Django
 * Mapeia a interface antiga para a nova implementação Django
 */

"use client"

import React from "react"
import { useAuth as useDjangoAuth } from '@/context/django-auth-context'

// Tipos de compatibilidade para manter interface original
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'customer' | 'braider' | 'admin'
  image?: string
  phone?: string
}

export interface AuthSession {
  user: AuthUser
}

export interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  user: AuthUser | null
}

// Hook de compatibilidade que mapeia a interface Django para a antiga
export function useAuth(): AuthContextType {
  const { user, isLoading, isAuthenticated } = useDjangoAuth()

  // Mapear user Django para formato esperado pelo componente antigo
  const mappedUser = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.avatar_url,
    phone: user.phone
  } : null

  return {
    session: user && isAuthenticated && mappedUser ? { user: mappedUser } : null,
    isLoading,
    user: mappedUser,
  }
}

// Componente provider de compatibilidade (não usado, mas mantido para compatibilidade)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
