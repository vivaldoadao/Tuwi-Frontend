// ===================================
// SISTEMA DE RESPOSTAS PADRONIZADAS
// ===================================

import { NextResponse } from 'next/server'
import type { 
  ApiResponse, 
  ApiMeta, 
  PaginationMeta, 
  ResponseBuilder,
  ApiError,
  ApiErrorCode
} from '@/types/api-new'

// Generate request ID for tracking
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create standardized API response
const createResponse = <T>(
  data: ApiResponse<T>,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse => {
  // Add standard headers
  const standardHeaders = {
    'Content-Type': 'application/json',
    'X-Request-ID': generateRequestId(),
    'X-Timestamp': new Date().toISOString(),
    'X-API-Version': '1.0',
    ...headers
  }
  
  return NextResponse.json(data, {
    status,
    headers: standardHeaders
  })
}

// Enhanced response builder
export const apiResponse: ResponseBuilder = {
  // Success response
  success<T>(data: T, message?: string, meta?: ApiMeta): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    }
    
    return createResponse(response, 200)
  },

  // Error response
  error(error: string | ApiError, status: number = 500): NextResponse {
    const errorObj = typeof error === 'string' ? { message: error } : error
    
    const response: ApiResponse = {
      success: false,
      error: errorObj.message,
      meta: {
        timestamp: new Date().toISOString(),
        ...(errorObj.code && { code: errorObj.code }),
        ...(errorObj.details && { details: errorObj.details })
      }
    }
    
    // Log error for debugging
    console.error(`[API Error] ${status}: ${errorObj.message}`, {
      code: errorObj.code,
      details: errorObj.details,
      status
    })
    
    return createResponse(response, status)
  },

  // Validation error response
  validationError(errors: Record<string, string>): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'Dados inválidos',
      errors: Object.entries(errors).map(([field, message]) => `${field}: ${message}`),
      meta: {
        timestamp: new Date().toISOString(),
        code: ApiErrorCode.VALIDATION_ERROR,
        details: errors
      }
    }
    
    return createResponse(response, 400)
  },

  // Not found response
  notFound(resource: string = 'Recurso'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: `${resource} não encontrado`,
      meta: {
        timestamp: new Date().toISOString(),
        code: ApiErrorCode.NOT_FOUND
      }
    }
    
    return createResponse(response, 404)
  },

  // Unauthorized response
  unauthorized(message: string = 'Acesso não autorizado'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      meta: {
        timestamp: new Date().toISOString(),
        code: ApiErrorCode.UNAUTHORIZED
      }
    }
    
    return createResponse(response, 401)
  },

  // Forbidden response
  forbidden(message: string = 'Acesso negado'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      meta: {
        timestamp: new Date().toISOString(),
        code: ApiErrorCode.FORBIDDEN
      }
    }
    
    return createResponse(response, 403)
  },

  // Conflict response
  conflict(message: string = 'Conflito de dados'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      meta: {
        timestamp: new Date().toISOString(),
        code: ApiErrorCode.CONFLICT
      }
    }
    
    return createResponse(response, 409)
  },

  // Rate limit response
  rateLimit(reset?: number): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'Limite de requisições excedido',
      meta: {
        timestamp: new Date().toISOString(),
        code: ApiErrorCode.RATE_LIMITED,
        ...(reset && { rateLimit: { reset } })
      }
    }
    
    const headers = reset ? { 'Retry-After': reset.toString() } : {}
    
    return createResponse(response, 429, headers)
  },

  // Paginated response
  paginated<T>(
    data: T[], 
    pagination: PaginationMeta, 
    message?: string
  ): NextResponse {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        pagination
      }
    }
    
    return createResponse(response, 200)
  }
}

// Specialized response builders for common scenarios
export const apiSuccess = {
  // Created resource
  created<T>(data: T, message: string = 'Recurso criado com sucesso'): NextResponse {
    return apiResponse.success(data, message)
  },

  // Updated resource
  updated<T>(data: T, message: string = 'Recurso atualizado com sucesso'): NextResponse {
    return apiResponse.success(data, message)
  },

  // Deleted resource
  deleted(message: string = 'Recurso excluído com sucesso'): NextResponse {
    return apiResponse.success(null, message)
  },

  // No content (for operations that don't return data)
  noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  },

  // List with pagination
  list<T>(
    items: T[], 
    page: number, 
    limit: number, 
    total: number,
    message?: string
  ): NextResponse {
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
    
    return apiResponse.paginated(items, pagination, message)
  }
}

// Error response builders
export const apiError = {
  // Bad request with details
  badRequest(message: string, details?: any): NextResponse {
    return apiResponse.error({
      message,
      code: ApiErrorCode.BAD_REQUEST,
      details
    }, 400)
  },

  // Database error
  database(message: string = 'Erro no banco de dados', details?: any): NextResponse {
    return apiResponse.error({
      message,
      code: ApiErrorCode.DATABASE_ERROR,
      details
    }, 500)
  },

  // External service error
  externalService(service: string, details?: any): NextResponse {
    return apiResponse.error({
      message: `Erro no serviço externo: ${service}`,
      code: ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      details
    }, 502)
  },

  // Timeout error
  timeout(operation: string = 'Operação'): NextResponse {
    return apiResponse.error({
      message: `${operation} excedeu o tempo limite`,
      code: ApiErrorCode.TIMEOUT
    }, 408)
  },

  // Method not allowed
  methodNotAllowed(method: string, allowed: string[]): NextResponse {
    return apiResponse.error({
      message: `Método ${method} não permitido. Métodos permitidos: ${allowed.join(', ')}`,
      code: ApiErrorCode.METHOD_NOT_ALLOWED
    }, 405)
  },

  // Internal server error
  internal(message: string = 'Erro interno do servidor', details?: any): NextResponse {
    return apiResponse.error({
      message,
      code: ApiErrorCode.INTERNAL_ERROR,
      details
    }, 500)
  }
}

// Wrapper function to handle common API patterns
export const withApiHandler = (
  handler: (request: Request, context?: any) => Promise<NextResponse>
) => {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API Handler Error]:', error)
      
      // Handle known error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return apiError.timeout()
        }
        
        if (error.message.includes('not found')) {
          return apiResponse.notFound()
        }
        
        if (error.message.includes('unauthorized')) {
          return apiResponse.unauthorized()
        }
        
        if (error.message.includes('forbidden')) {
          return apiResponse.forbidden()
        }
      }
      
      // Default to internal server error
      return apiError.internal('Erro inesperado no servidor')
    }
  }
}

// Utility to add CORS headers to any response
export const withCors = (
  response: NextResponse,
  origin: string = '*',
  methods: string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: string[] = ['Content-Type', 'Authorization']
): NextResponse => {
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
  
  return response
}

// Handle OPTIONS requests for CORS preflight
export const handleOptions = (
  origin: string = '*',
  methods: string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: string[] = ['Content-Type', 'Authorization']
): NextResponse => {
  const response = new NextResponse(null, { status: 200 })
  return withCors(response, origin, methods, headers)
}