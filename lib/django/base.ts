/**
 * Base Django API client - responsável apenas pelas operações de autenticação e setup
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Base API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1'

// Helper function to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token')
    : null

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Helper function for API calls
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    // Handle validation errors specifically
    if (response.status === 400 && errorData.errors) {
      const errorMessages = []
      for (const [field, errors] of Object.entries(errorData.errors)) {
        if (Array.isArray(errors)) {
          errorMessages.push(`${field}: ${errors.join(', ')}`)
        } else {
          errorMessages.push(`${field}: ${errors}`)
        }
      }
      throw new Error(`Validation error: ${errorMessages.join('; ')}`)
    }
    
    throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Paginated response interface
export interface DjangoPaginatedResponse<T> {
  count: number
  total_pages: number
  current_page: number
  page_size: number
  next: string | null
  previous: string | null
  results: T[]
}