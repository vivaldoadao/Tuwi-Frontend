// ===================================
// HOOK GENÉRICO PARA API CLIENT
// ===================================

import { useState, useCallback, useRef } from 'react'
import type { 
  ApiResponse, 
  ApiError, 
  ApiRequestConfig 
} from '@/types/api'

interface UseApiClientOptions {
  baseURL?: string
  defaultHeaders?: Record<string, string>
  timeout?: number
  retries?: number
  onError?: (error: ApiError) => void
  onSuccess?: (response: any) => void
}

interface UseApiClientReturn {
  loading: boolean
  error: ApiError | null
  data: any
  // HTTP Methods
  get: <T = any>(url: string, config?: ApiRequestConfig) => Promise<ApiResponse<T>>
  post: <T = any>(url: string, data?: any, config?: ApiRequestConfig) => Promise<ApiResponse<T>>
  put: <T = any>(url: string, data?: any, config?: ApiRequestConfig) => Promise<ApiResponse<T>>
  patch: <T = any>(url: string, data?: any, config?: ApiRequestConfig) => Promise<ApiResponse<T>>
  delete: <T = any>(url: string, config?: ApiRequestConfig) => Promise<ApiResponse<T>>
  // Utilities
  setLoading: (loading: boolean) => void
  setError: (error: ApiError | null) => void
  setData: (data: any) => void
  clearError: () => void
  reset: () => void
}

export function useApiClient(options: UseApiClientOptions = {}): UseApiClientReturn {
  const {
    baseURL = '',
    defaultHeaders = {},
    timeout = 30000,
    retries = 0,
    onError,
    onSuccess
  } = options

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [data, setData] = useState<any>(null)

  // Refs para callbacks
  const onErrorRef = useRef(onError)
  const onSuccessRef = useRef(onSuccess)

  // Update refs when callbacks change
  onErrorRef.current = onError
  onSuccessRef.current = onSuccess

  // Função principal de request
  const request = useCallback(async <T = any>(
    method: string,
    url: string,
    requestData?: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> => {
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
    
    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
        ...config.headers
      },
      signal: config.signal
    }

    if (requestData && (method !== 'GET' && method !== 'DELETE')) {
      requestConfig.body = JSON.stringify(requestData)
    }

    // Add URL params for GET requests
    if (requestData && method === 'GET') {
      const params = new URLSearchParams(requestData)
      const separator = fullUrl.includes('?') ? '&' : '?'
      url = `${fullUrl}${separator}${params.toString()}`
    }

    setLoading(true)
    setError(null)

    let attempt = 0
    const maxAttempts = retries + 1

    while (attempt < maxAttempts) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(fullUrl, {
          ...requestConfig,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        let responseData: any
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        if (!response.ok) {
          const apiError: ApiError = {
            message: responseData.message || responseData.error || `HTTP ${response.status}`,
            status: response.status,
            code: responseData.code,
            details: responseData
          }
          
          throw apiError
        }

        const apiResponse: ApiResponse<T> = {
          success: true,
          data: responseData.data || responseData,
          message: responseData.message,
          meta: responseData.meta
        }

        setData(apiResponse.data)
        
        if (onSuccessRef.current) {
          onSuccessRef.current(apiResponse)
        }

        return apiResponse

      } catch (err) {
        attempt++
        
        const apiError: ApiError = err instanceof Error ? {
          message: err.message,
          code: 'NETWORK_ERROR'
        } : err as ApiError

        if (attempt >= maxAttempts) {
          setError(apiError)
          
          if (onErrorRef.current) {
            onErrorRef.current(apiError)
          }

          throw apiError
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      } finally {
        if (attempt >= maxAttempts) {
          setLoading(false)
        }
      }
    }

    throw new Error('Max attempts reached')
  }, [baseURL, defaultHeaders, timeout, retries])

  // HTTP Methods
  const get = useCallback(<T = any>(url: string, config?: ApiRequestConfig) => {
    return request<T>('GET', url, config?.params, config)
  }, [request])

  const post = useCallback(<T = any>(url: string, data?: any, config?: ApiRequestConfig) => {
    return request<T>('POST', url, data, config)
  }, [request])

  const put = useCallback(<T = any>(url: string, data?: any, config?: ApiRequestConfig) => {
    return request<T>('PUT', url, data, config)
  }, [request])

  const patch = useCallback(<T = any>(url: string, data?: any, config?: ApiRequestConfig) => {
    return request<T>('PATCH', url, data, config)
  }, [request])

  const deleteMethod = useCallback(<T = any>(url: string, config?: ApiRequestConfig) => {
    return request<T>('DELETE', url, undefined, config)
  }, [request])

  // Utilities
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    // State
    loading,
    error,
    data,
    
    // Methods
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
    
    // Utilities
    setLoading,
    setError,
    setData,
    clearError,
    reset
  }
}