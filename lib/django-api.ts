/**
 * Cliente API para comunicação com Django REST API
 * Substitui NextAuth.js para autenticação e dados
 */

import { toast } from 'react-hot-toast'

// Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'braider' | 'admin'
  avatar_url?: string
  phone?: string
  is_verified: boolean
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class DjangoAPIClient {
  private baseURL: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'
    
    // Carregar tokens do localStorage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token')
      this.refreshToken = localStorage.getItem('refresh_token')
    }
  }

  // ============================================================================
  // MÉTODOS BASE HTTP
  // ============================================================================

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      }

      // Adicionar token de autorização se disponível
      if (this.accessToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }

      const response = await fetch(url, config)
      
      // Handle non-JSON responses
      let data
      try {
        data = await response.json()
      } catch (error) {
        data = {}
      }

      if (!response.ok) {
        // Se token expirou, tentar refresh
        if (response.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            // Retry original request
            return this.request(endpoint, options)
          }
        }

        // Tratar erros de validação específicos
        let errorMessage = data.message || data.error || data.detail || 'Erro na requisição'
        
        // Se há detalhes de validação, extrair mensagens mais específicas
        if (data.details) {
          const validationErrors = []
          for (const [, errors] of Object.entries(data.details)) {
            if (Array.isArray(errors)) {
              validationErrors.push(...errors)
            } else if (typeof errors === 'string') {
              validationErrors.push(errors)
            }
          }
          if (validationErrors.length > 0) {
            errorMessage = validationErrors.join(' ')
          }
        }

        return {
          success: false,
          error: errorMessage,
          data: data
        }
      }

      return {
        success: true,
        data: data,
        message: data.message
      }
    } catch (error) {
      console.error('API Request Error:', error)
      return {
        success: false,
        error: 'Erro de conexão. Verifique sua internet.',
      }
    }
  }

  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; access: string; refresh: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      // Armazenar tokens
      this.setTokens(response.data.access, response.data.refresh)
      
      return {
        success: true,
        data: {
          user: response.data.user,
          tokens: {
            access: response.data.access,
            refresh: response.data.refresh
          }
        }
      }
    }

    return response as ApiResponse<{ user: User; tokens: AuthTokens }>
  }

  async register(data: RegisterData): Promise<ApiResponse<{ email: string; requires_verification: boolean }>> {
    const response = await this.request<{ email: string; requires_verification: boolean; message: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    return {
      success: response.success,
      data: response.data,
      error: response.error,
      message: response.message
    }
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: this.refreshToken }),
    })

    // Limpar tokens independentemente da resposta
    this.clearTokens()

    return response
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'Token de acesso não encontrado'
      }
    }

    return this.request<User>('/auth/me/')
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      this.clearTokens()
      return false
    }

    try {
      const response = await this.request<{ access: string }>('/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: this.refreshToken }),
      })

      if (response.success && response.data) {
        this.setAccessToken(response.data.access)
        return true
      }

      this.clearTokens()
      return false
    } catch {
      this.clearTokens()
      return false
    }
  }

  async verifyEmail(email: string, code: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; access: string; refresh: string }>('/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    
    if (response.success && response.data) {
      this.setTokens(response.data.access, response.data.refresh)
      return {
        success: true,
        data: {
          user: response.data.user,
          tokens: { access: response.data.access, refresh: response.data.refresh }
        }
      }
    }
    return {
      success: false,
      error: response.error,
      data: undefined
    }
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return this.request('/auth/resend-verification/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async confirmPasswordReset(token: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password-confirm/', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  // ============================================================================
  // PERFIL DO USUÁRIO
  // ============================================================================

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword,
        new_password: newPassword 
      }),
    })
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData()
    formData.append('avatar', file)

    return this.request<{ avatar_url: string }>('/auth/upload-avatar/', {
      method: 'POST',
      headers: {
        // Não definir Content-Type para FormData
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    })
  }

  // ============================================================================
  // GESTÃO DE TOKENS
  // ============================================================================

  private setTokens(access: string, refresh: string) {
    this.accessToken = access
    this.refreshToken = refresh
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
    }
  }

  private setAccessToken(access: string) {
    this.accessToken = access
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access)
    }
  }

  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  // ============================================================================
  // MÉTODOS GENÉRICOS PARA OUTRAS APIS
  // ============================================================================

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Instância singleton
export const djangoAPI = new DjangoAPIClient()

// Export default para facilitar importação
export default djangoAPI