/**
 * 🔒 SECURITY MIDDLEWARE: API Security Enhancements
 * 
 * This middleware provides security enhancements for API routes including:
 * - Rate limiting
 * - Input sanitization
 * - Security headers
 * - Request logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SecurityOptions {
  requireAuth?: boolean
  rateLimit?: {
    max: number
    windowMinutes: number
    action: string
  }
  validateInput?: boolean
  logRequests?: boolean
}

/**
 * Apply rate limiting to API endpoints
 */
export async function applyRateLimit(
  request: NextRequest,
  action: string,
  max: number = 10,
  windowMinutes: number = 60
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const serviceClient = getServiceClient()
    
    const { data: rateLimitResult, error: rateLimitError } = await serviceClient
      .rpc('check_rate_limit_v2', {
        p_identifier: clientIp,
        p_action: action,
        p_limit: max,
        p_window_minutes: windowMinutes
      })
    
    if (rateLimitError) {
      console.error('❌ Rate limit check failed:', rateLimitError)
      return { allowed: false, error: 'Erro interno de segurança' }
    }
    
    if (!rateLimitResult) {
      console.warn(`🚫 Rate limit exceeded for IP: ${clientIp}, action: ${action}`)
      return { 
        allowed: false, 
        error: 'Muitas solicitações em pouco tempo. Aguarde alguns minutos.' 
      }
    }
    
    return { allowed: true }
    
  } catch (error) {
    console.error('💥 Rate limiting error:', error)
    return { allowed: false, error: 'Erro interno de segurança' }
  }
}

/**
 * Sanitize input data to prevent XSS and injection attacks
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item))
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return data
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Content Security Policy (basic)
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  
  return response
}

/**
 * Log security-relevant API requests
 */
export async function logSecurityEvent(
  request: NextRequest,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const serviceClient = getServiceClient()
    
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await serviceClient
      .rpc('log_security_event', {
        p_table_name: 'api_requests',
        p_operation: action,
        p_record_id: null,
        p_old_values: null,
        p_new_values: JSON.stringify({
          ip: clientIp,
          userAgent,
          url: request.url,
          method: request.method,
          ...details
        })
      })
      
  } catch (error) {
    console.error('💥 Security logging error:', error)
    // Don't fail the request if logging fails
  }
}

/**
 * Main security middleware function
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: SecurityOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = await applyRateLimit(
          request,
          options.rateLimit.action,
          options.rateLimit.max,
          options.rateLimit.windowMinutes
        )
        
        if (!rateLimitResult.allowed) {
          const response = NextResponse.json(
            { success: false, error: rateLimitResult.error },
            { status: 429 }
          )
          return addSecurityHeaders(response)
        }
      }
      
      // 2. Request logging
      if (options.logRequests) {
        await logSecurityEvent(request, 'api_access')
      }
      
      // 3. Call the actual handler
      const response = await handler(request)
      
      // 4. Add security headers
      return addSecurityHeaders(response)
      
    } catch (error) {
      console.error('💥 Security middleware error:', error)
      const response = NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
      return addSecurityHeaders(response)
    }
  }
}

/**
 * Helper function to create a secure API handler
 */
export function createSecureHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: SecurityOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return withSecurity(handler, {
    rateLimit: {
      max: 30,
      windowMinutes: 60,
      action: 'api_access'
    },
    logRequests: true,
    ...options
  })
}

/**
 * Validate request content type
 */
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): boolean {
  const contentType = request.headers.get('content-type')
  return contentType?.includes(expectedType) || false
}

/**
 * Extract and validate request size
 */
export function validateRequestSize(request: NextRequest, maxSizeBytes: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length')
  if (!contentLength) return true // Let it through, size will be checked during JSON parsing
  
  const size = parseInt(contentLength, 10)
  return size <= maxSizeBytes
}