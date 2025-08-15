import { useAuth } from '@/context/auth-context'
import { 
  hasRole, 
  hasRolePermission, 
  canAccessRoute, 
  getDefaultRedirectPath,
  isAdmin,
  isBraider,
  isCustomer,
  canManageBraiders,
  canManageProducts,
  canManageOrders,
  getRoleDisplayName,
  USER_ROLES,
  type UserRole 
} from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useUserRole() {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  // Basic role checks
  const userRole = session?.user?.role as UserRole | undefined
  const isAuthenticated = !!session?.user

  // Role checking functions
  const checkRole = useCallback((role: UserRole) => hasRole(session, role), [session])
  const checkRolePermission = useCallback((role: UserRole) => hasRolePermission(session, role), [session])
  const checkRouteAccess = useCallback((path: string) => canAccessRoute(session, path), [session])

  // Convenience role checks
  const userIsAdmin = isAdmin(session)
  const userIsBraider = isBraider(session)
  const userIsCustomer = isCustomer(session)

  // Permission checks
  const canUserManageBraiders = canManageBraiders(session)
  const canUserManageProducts = canManageProducts(session)
  const canUserManageOrders = useCallback(
    (orderUserId?: string) => canManageOrders(session, orderUserId),
    [session]
  )

  // Navigation helpers
  const redirectToDefaultDashboard = useCallback(() => {
    const defaultPath = getDefaultRedirectPath(session)
    router.push(defaultPath as any)
  }, [session, router])

  const redirectToDashboard = useCallback((role?: UserRole) => {
    const targetRole = role || (userRole as UserRole)
    if (!targetRole) {
      router.push('/login')
      return
    }

    const paths = {
      customer: '/dashboard',
      braider: '/braider-dashboard',
      admin: '/admin'
    }
    
    router.push(paths[targetRole] as any)
  }, [userRole, router])

  // Role display helpers
  const roleDisplayName = userRole ? getRoleDisplayName(userRole) : 'Usuário'

  // Route guard hook
  const requireRole = useCallback((requiredRole: UserRole, redirectOnFail = true) => {
    if (isLoading) return null // Still loading
    
    if (!checkRolePermission(requiredRole)) {
      if (redirectOnFail) {
        redirectToDefaultDashboard()
      }
      return false
    }
    
    return true
  }, [isLoading, checkRolePermission, redirectToDefaultDashboard])

  // Route access guard
  const requireRouteAccess = useCallback((path: string, redirectOnFail = true) => {
    if (isLoading) return null // Still loading
    
    if (!checkRouteAccess(path)) {
      if (redirectOnFail) {
        redirectToDefaultDashboard()
      }
      return false
    }
    
    return true
  }, [isLoading, checkRouteAccess, redirectToDefaultDashboard])

  return {
    // Basic info
    isLoading,
    isAuthenticated,
    userRole,
    roleDisplayName,
    session,

    // Role checks
    checkRole,
    checkRolePermission,
    checkRouteAccess,

    // Convenience checks
    isAdmin: userIsAdmin,
    isBraider: userIsBraider,
    isCustomer: userIsCustomer,

    // Permission checks
    canManageBraiders: canUserManageBraiders,
    canManageProducts: canUserManageProducts,
    canManageOrders: canUserManageOrders,

    // Navigation
    redirectToDefaultDashboard,
    redirectToDashboard,

    // Guards
    requireRole,
    requireRouteAccess,

    // Constants
    USER_ROLES
  }
}