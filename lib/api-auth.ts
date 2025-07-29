import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { USER_ROLES, type UserRole } from '@/lib/roles'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}

/**
 * Middleware to protect API routes with authentication
 */
export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<Response>
) {
  return async function(request: NextRequest): Promise<Response> {
    try {
      const session = await auth()

      if (!session?.user?.id) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }), 
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user.role as UserRole) || USER_ROLES.CUSTOMER
      }

      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Middleware to protect API routes with role-based access control
 */
export function withRole(
  requiredRole: UserRole,
  handler: (request: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const userRole = request.user.role
    
    // Check if user has sufficient role level
    const roleHierarchy = { customer: 1, braider: 2, admin: 3 }
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    if (userLevel < requiredLevel) {
      return new Response(
        JSON.stringify({ error: 'Permissão insuficiente' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request)
  })
}

/**
 * Middleware for admin-only API routes
 */
export function withAdmin(
  handler: (request: AuthenticatedRequest) => Promise<Response>
) {
  return withRole(USER_ROLES.ADMIN, handler)
}

/**
 * Middleware for braider-level API routes (braiders and admins)
 */
export function withBraider(
  handler: (request: AuthenticatedRequest) => Promise<Response>
) {
  return withRole(USER_ROLES.BRAIDER, handler)
}