import type { Session } from 'next-auth'

// Role definitions
export const USER_ROLES = {
  CUSTOMER: 'customer',
  BRAIDER: 'braider',
  ADMIN: 'admin'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  braider: 2,
  admin: 3
}

// Route access mapping
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  customer: ['/profile', '/orders', '/cart', '/checkout', '/favorites'],
  braider: ['/braider-dashboard', '/braider-dashboard/*', '/profile', '/orders'],
  admin: ['/dashboard', '/admin', '/admin/*', '/profile', '/orders', '/cart', '/checkout']
}

// Default redirect paths for each role
export const ROLE_REDIRECT_PATHS: Record<UserRole, string> = {
  customer: '/',
  braider: '/braider-dashboard',
  admin: '/dashboard'
}

/**
 * Check if a user has a specific role
 */
export function hasRole(session: Session | null, role: UserRole): boolean {
  if (!session?.user?.role) return false
  return session.user.role === role
}

/**
 * Check if a user has permission to access a role (equal or higher hierarchy)
 */
export function hasRolePermission(session: Session | null, requiredRole: UserRole): boolean {
  if (!session?.user?.role) return false
  
  const userRoleLevel = ROLE_HIERARCHY[session.user.role as UserRole] || 0
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(session: Session | null, pathname: string): boolean {
  if (!session?.user?.role) return false
  
  const userRole = session.user.role as UserRole
  const allowedRoutes = ROLE_ROUTES[userRole] || []
  
  return allowedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2)
      return pathname.startsWith(baseRoute)
    }
    return pathname.startsWith(route)
  })
}

/**
 * Get the default redirect path for a user's role
 */
export function getDefaultRedirectPath(session: Session | null): string {
  if (!session?.user?.role) return '/login'
  
  const userRole = session.user.role as UserRole
  return ROLE_REDIRECT_PATHS[userRole] || '/dashboard'
}

/**
 * Check if a user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, USER_ROLES.ADMIN)
}

/**
 * Check if a user is a braider
 */
export function isBraider(session: Session | null): boolean {
  return hasRole(session, USER_ROLES.BRAIDER)
}

/**
 * Check if a user is a customer
 */
export function isCustomer(session: Session | null): boolean {
  return hasRole(session, USER_ROLES.CUSTOMER)
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    customer: 'Cliente',
    braider: 'Trancista',
    admin: 'Administrador'
  }
  
  return roleNames[role] || 'Usuário'
}

/**
 * Check if a user can manage braiders (admin only)
 */
export function canManageBraiders(session: Session | null): boolean {
  return isAdmin(session)
}

/**
 * Check if a user can manage products (admin only)
 */
export function canManageProducts(session: Session | null): boolean {
  return isAdmin(session)
}

/**
 * Check if a user can manage orders (admin or braider for their own orders)
 */
export function canManageOrders(session: Session | null, orderUserId?: string): boolean {
  if (isAdmin(session)) return true
  if (isBraider(session)) return true // Braiders can see orders for their services
  if (isCustomer(session) && orderUserId === session?.user?.id) return true
  return false
}