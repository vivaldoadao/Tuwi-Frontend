/**
 * Django API functions for admin dashboard
 */

import djangoAPI from './django-api'

// Extended User type compatible with Django response
export type DjangoUser = {
  id: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'braider' | 'admin'
  is_active: boolean
  email_verified: boolean
  date_joined: string
  last_login?: string | null
  avatar?: string | null
}

export type UsersResponse = {
  users: DjangoUser[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  stats: {
    total_users: number
    active_users: number
    customer_users: number
    braider_users: number
    admin_users: number
    verified_users: number
  }
}

/**
 * Get all users with pagination and filters (Django version)
 */
export async function getAllUsersDjango(
  page: number = 1, 
  limit: number = 20,
  search: string = '',
  role: string = '',
  status: string = ''
): Promise<UsersResponse> {
  try {
    // Use the Django API client instead
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (search) params.append('search', search)
    if (role) params.append('role', role)
    if (status) params.append('status', status)

    const response = await djangoAPI.get<{users: any[], pagination: any, stats: any}>(`/auth/admin/users/?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch users')
    }

    const data = response.data!

    // Transform Django response to match frontend interface
    return {
      users: data.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        email_verified: user.email_verified,
        date_joined: user.date_joined,
        last_login: user.last_login,
        avatar: user.avatar,
      })),
      pagination: data.pagination,
      stats: data.stats
    }

  } catch (error) {
    console.error('Error fetching users from Django:', error)
    throw error
  }
}

/**
 * Get single user by ID (Django version)
 */
export async function getUserByIdDjango(userId: string): Promise<any> {
  try {
    const response = await djangoAPI.get<{user: DjangoUser}>(`/auth/admin/users/${userId}/`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user')
    }


    // Django returns {user: userData}, so we need to access .user
    const userData = response.data!.user
    
    // Convert to frontend format
    return convertDjangoUserToFrontend(userData)
  } catch (error) {
    console.error('Error fetching user by ID from Django:', error)
    throw error
  }
}

/**
 * Update user role (Django version)
 */
export async function updateUserRoleDjango(userId: string, role: 'customer' | 'braider' | 'admin'): Promise<{success: boolean, error?: string}> {
  if (!userId || userId === 'undefined' || userId === 'null') {
    return {
      success: false,
      error: 'ID do usuário inválido'
    }
  }

  try {
    const url = `/auth/admin/users/${userId}/role/`
    const response = await djangoAPI.patch(url, { role })
    
    return {
      success: response.success,
      error: response.error
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    return {
      success: false,
      error: 'Erro inesperado'
    }
  }
}

/**
 * Toggle user status (Django version)
 */
export async function toggleUserStatusDjango(userId: string): Promise<{success: boolean, error?: string}> {
  if (!userId || userId === 'undefined' || userId === 'null') {
    return {
      success: false,
      error: 'ID do usuário inválido'
    }
  }

  try {
    const url = `/auth/admin/users/${userId}/status/`
    const response = await djangoAPI.patch(url, {})
    
    return {
      success: response.success,
      error: response.error
    }
  } catch (error) {
    console.error('Error toggling user status:', error)
    return {
      success: false,
      error: 'Erro inesperado'
    }
  }
}

/**
 * Update user data (Django version)
 */
export async function updateUserDjango(userId: string, userData: {name: string, email: string, phone?: string}): Promise<{success: boolean, error?: string}> {
  try {
    const response = await djangoAPI.patch(`/auth/admin/users/${userId}/update/`, userData)
    
    return {
      success: response.success,
      error: response.error
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      error: 'Erro inesperado'
    }
  }
}

/**
 * Delete user (Django version)
 */
export async function deleteUserDjango(userId: string): Promise<{success: boolean, message?: string, error?: string, cascadeTest?: any}> {
  try {
    const response = await djangoAPI.delete<{message?: string, cascadeTest?: any}>(`/auth/admin/users/${userId}/delete/`)
    
    return {
      success: response.success,
      message: response.data?.message || response.message,
      error: response.error,
      cascadeTest: response.data?.cascadeTest
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      success: false,
      error: 'Erro inesperado ao deletar usuário'
    }
  }
}

/**
 * Convert DjangoUser to the format expected by the frontend components
 */
export function convertDjangoUserToFrontend(djangoUser: DjangoUser) {
  return {
    id: djangoUser.id,
    name: djangoUser.name,
    email: djangoUser.email,
    phone: djangoUser.phone || '',
    role: djangoUser.role,
    avatar_url: djangoUser.avatar || undefined,
    createdAt: djangoUser.date_joined,
    isActive: djangoUser.is_active,
    lastLogin: djangoUser.last_login || undefined,
    emailVerified: djangoUser.email_verified,
  }
}