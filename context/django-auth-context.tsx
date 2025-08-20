"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import djangoAPI, { User, LoginCredentials, RegisterData, ApiResponse } from '@/lib/django-api'

// Types
interface AuthContextType {
  // Estado
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Métodos de autenticação
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<{ success: boolean; email?: string; requiresVerification?: boolean }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  setIsAuthenticated: (authenticated: boolean) => void
  
  // Métodos de perfil
  updateProfile: (data: Partial<User>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  uploadAvatar: (file: File) => Promise<boolean>
  
  // Utilitários
  hasRole: (role: string | string[]) => boolean
  canAccess: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider Component
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // Verificar se há token no localStorage
      if (djangoAPI.isAuthenticated()) {
        const response = await djangoAPI.getCurrentUser()
        
        if (response.success && response.data) {
          setUser(response.data)
          setIsAuthenticated(true)
        } else {
          // Token inválido, limpar
          await logout()
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error)
      await logout()
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // ============================================================================

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await djangoAPI.login(credentials)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        
        toast.success(`Bem-vindo, ${response.data.user.name}!`)
        return true
      } else {
        toast.error(response.error || 'Erro ao fazer login')
        return false
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast.error('Erro interno. Tente novamente.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; email?: string; requiresVerification?: boolean }> => {
    try {
      setIsLoading(true)
      
      const response = await djangoAPI.register(data)
      
      if (response.success && response.data) {
        toast.success(response.message || 'Conta criada com sucesso!')
        
        return {
          success: true,
          email: response.data.email,
          requiresVerification: response.data.requires_verification
        }
      } else {
        toast.error(response.error || 'Erro ao criar conta')
        return { success: false }
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      toast.error('Erro interno. Tente novamente.')
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Chamar logout no backend (opcional, pode falhar)
      await djangoAPI.logout()
    } catch (error) {
      console.error('Erro ao fazer logout no backend:', error)
    } finally {
      // Sempre limpar estado local
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Logout realizado com sucesso')
    }
  }

  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated) return

    try {
      const response = await djangoAPI.getCurrentUser()
      
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        // Se falhou, fazer logout
        await logout()
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  // ============================================================================
  // MÉTODOS DE PERFIL
  // ============================================================================

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await djangoAPI.updateProfile(data)
      
      if (response.success && response.data) {
        setUser(response.data)
        toast.success('Perfil atualizado com sucesso!')
        return true
      } else {
        toast.error(response.error || 'Erro ao atualizar perfil')
        return false
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro interno. Tente novamente.')
      return false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await djangoAPI.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        toast.success('Senha alterada com sucesso!')
        return true
      } else {
        toast.error(response.error || 'Erro ao alterar senha')
        return false
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro interno. Tente novamente.')
      return false
    }
  }

  const uploadAvatar = async (file: File): Promise<boolean> => {
    try {
      const response = await djangoAPI.uploadAvatar(file)
      
      if (response.success && response.data) {
        // Atualizar user com nova URL do avatar
        if (user) {
          setUser({
            ...user,
            avatar_url: response.data.avatar_url
          })
        }
        
        toast.success('Avatar atualizado com sucesso!')
        return true
      } else {
        toast.error(response.error || 'Erro ao fazer upload do avatar')
        return false
      }
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
      toast.error('Erro interno. Tente novamente.')
      return false
    }
  }

  // ============================================================================
  // UTILITÁRIOS DE AUTORIZAÇÃO
  // ============================================================================

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false
    
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    
    return user.role === role
  }

  const canAccess = (roles: string[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  // ============================================================================
  // PROVIDER VALUE
  // ============================================================================

  const value: AuthContextType = {
    // Estado
    user,
    isLoading,
    isAuthenticated,
    
    // Métodos de autenticação
    login,
    register,
    logout,
    refreshUser,
    setUser,
    setIsAuthenticated,
    
    // Métodos de perfil
    updateProfile,
    changePassword,
    uploadAvatar,
    
    // Utilitários
    hasRole,
    canAccess,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

// Hook para verificar se usuário tem permissão
export function useAuthGuard(requiredRoles: string[] = []) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth()
  
  const canAccess = isAuthenticated && (
    requiredRoles.length === 0 || hasRole(requiredRoles)
  )
  
  return {
    user,
    isLoading,
    isAuthenticated,
    canAccess,
    hasRequiredRole: hasRole(requiredRoles)
  }
}

export default AuthContext