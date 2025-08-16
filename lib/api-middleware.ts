// ===================================
// MIDDLEWARES PADRONIZADOS PARA API
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { 
  ApiContext, 
  ApiMiddleware, 
  AuthMiddlewareConfig,
  RateLimitConfig,
  ValidationConfig,
  ApiRouteOptions
} from '@/types/api-new'

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Authentication Middleware
export const authMiddleware = (config: AuthMiddlewareConfig = {}): ApiMiddleware => ({
  name: 'auth',
  handler: async (request: NextRequest, context: ApiContext) => {
    const { required = true, roles = [], allowAnonymous = false } = config
    
    try {
      const session = await auth()
      
      if (!session?.user) {
        if (required && !allowAnonymous) {
          return {
            success: false,
            error: 'Autenticação necessária'
          }
        }
        
        return {
          success: true,
          context: { ...context, user: undefined, session: undefined }
        }
      }
      
      // Check role requirements
      if (roles.length > 0 && !roles.includes(session.user.role)) {
        return {
          success: false,
          error: 'Permissões insuficientes'
        }
      }
      
      return {
        success: true,
        context: {
          ...context,
          user: session.user,
          session
        }
      }
    } catch (error) {
      console.error('Auth middleware error:', error)
      return {
        success: false,
        error: 'Erro na autenticação'
      }
    }
  }
})

// Rate Limiting Middleware
export const rateLimitMiddleware = (config: RateLimitConfig): ApiMiddleware => ({
  name: 'rateLimit',
  handler: async (request: NextRequest, context: ApiContext) => {
    const { maxRequests, windowMs, keyGenerator, skipIf } = config
    
    // Skip if condition is met
    if (skipIf && skipIf(request)) {
      return { success: true, context }
    }
    
    // Generate key for rate limiting
    const key = keyGenerator ? 
      keyGenerator(request) : 
      request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
    
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    // Get or create rate limit entry
    const entry = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
    
    // Check if within window and under limit
    if (entry.resetTime > now) {
      if (entry.count >= maxRequests) {
        return {
          success: false,
          error: 'Limite de requisições excedido'
        }
      }
      entry.count++
    } else {
      // Reset window
      entry.count = 1
      entry.resetTime = now + windowMs
    }
    
    rateLimitStore.set(key, entry)
    
    return {
      success: true,
      context: {
        ...context,
        metadata: {
          ...context.metadata,
          rateLimit: {
            limit: maxRequests,
            remaining: maxRequests - entry.count,
            reset: Math.ceil(entry.resetTime / 1000)
          }
        }
      }
    }
  }
})

// Validation Middleware
export const validationMiddleware = (config: ValidationConfig): ApiMiddleware => ({
  name: 'validation',
  handler: async (request: NextRequest, context: ApiContext) => {
    try {
      const validatedData: any = {}
      
      // Validate request body
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json()
          validatedData.body = config.body.parse(body)
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
            return {
              success: false,
              error: `Dados inválidos: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`
            }
          }
          return {
            success: false,
            error: 'Formato de dados inválido'
          }
        }
      }
      
      // Validate query parameters
      if (config.query) {
        const { searchParams } = new URL(request.url)
        const queryObject = Object.fromEntries(searchParams.entries())
        
        try {
          validatedData.query = config.query.parse(queryObject)
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
            return {
              success: false,
              error: `Parâmetros inválidos: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`
            }
          }
          return {
            success: false,
            error: 'Parâmetros de consulta inválidos'
          }
        }
      }
      
      // TODO: Validate route parameters when available
      // TODO: Validate file uploads when available
      
      return {
        success: true,
        context: {
          ...context,
          metadata: {
            ...context.metadata,
            validated: validatedData
          }
        }
      }
    } catch (error) {
      console.error('Validation middleware error:', error)
      return {
        success: false,
        error: 'Erro na validação dos dados'
      }
    }
  }
})

// CORS Middleware
export const corsMiddleware = (config: {
  origin?: string | string[]
  methods?: string[]
  headers?: string[]
} = {}): ApiMiddleware => ({
  name: 'cors',
  handler: async (request: NextRequest, context: ApiContext) => {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers = ['Content-Type', 'Authorization']
    } = config
    
    return {
      success: true,
      context: {
        ...context,
        metadata: {
          ...context.metadata,
          cors: {
            'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': headers.join(', ')
          }
        }
      }
    }
  }
})

// Logging Middleware
export const loggingMiddleware = (): ApiMiddleware => ({
  name: 'logging',
  handler: async (request: NextRequest, context: ApiContext) => {
    const startTime = Date.now()
    const { method, url } = request
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    console.log(`[API] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`)
    
    return {
      success: true,
      context: {
        ...context,
        metadata: {
          ...context.metadata,
          logging: {
            startTime,
            method,
            url,
            userAgent,
            ip
          }
        }
      }
    }
  }
})

// Combine multiple middlewares
export const combineMiddlewares = (middlewares: ApiMiddleware[]) => {
  return async (request: NextRequest): Promise<{
    success: boolean
    error?: string
    context: ApiContext
    headers?: Record<string, string>
  }> => {
    let context: ApiContext = {}
    const headers: Record<string, string> = {}
    
    for (const middleware of middlewares) {
      const result = await middleware.handler(request, context)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          context,
          headers
        }
      }
      
      if (result.context) {
        context = result.context
      }
      
      // Collect headers from middleware (like CORS)
      if (context.metadata?.cors) {
        Object.assign(headers, context.metadata.cors)
      }
    }
    
    return {
      success: true,
      context,
      headers
    }
  }
}

// Create API route with middleware
export const createApiRoute = (options: ApiRouteOptions = {}) => {
  const middlewares: ApiMiddleware[] = []
  
  // Always add logging
  middlewares.push(loggingMiddleware())
  
  // Add auth middleware if configured
  if (options.auth) {
    middlewares.push(authMiddleware(options.auth))
  }
  
  // Add rate limiting if configured
  if (options.rateLimit) {
    middlewares.push(rateLimitMiddleware(options.rateLimit))
  }
  
  // Add validation if configured
  if (options.validation) {
    middlewares.push(validationMiddleware(options.validation))
  }
  
  // Add CORS if configured
  if (options.cors) {
    middlewares.push(corsMiddleware(options.cors))
  }
  
  const combinedMiddleware = combineMiddlewares(middlewares)
  
  return {
    middleware: combinedMiddleware,
    options
  }
}