import type React from 'react'
import { useUserRole } from '@/hooks/use-user-role'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import type { UserRole } from '@/lib/roles'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  fallback?: React.ReactNode
  redirectOnFail?: boolean
  showError?: boolean
}

/**
 * Component that protects content based on user roles
 * 
 * Usage examples:
 * <RoleGuard requiredRole="admin">Admin only content</RoleGuard>
 * <RoleGuard requiredRoles={["admin", "braider"]}>Admin or Braider content</RoleGuard>
 */
export function RoleGuard({ 
  children, 
  requiredRole,
  requiredRoles,
  fallback,
  redirectOnFail = false,
  showError = true
}: RoleGuardProps) {
  const { isLoading, checkRole, checkRolePermission, isAuthenticated } = useUserRole()

  // Still loading authentication
  if (isLoading) {
    return fallback || <LoadingSpinner className="min-h-[200px]" text="Verificando permissões..." />
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (showError) {
      return fallback || <ErrorMessage message="Você precisa estar logado para acessar este conteúdo." />
    }
    return fallback || null
  }

  // Check single required role
  if (requiredRole && !checkRolePermission(requiredRole)) {
    if (showError) {
      return fallback || <ErrorMessage message="Você não tem permissão para acessar este conteúdo." />
    }
    return fallback || null
  }

  // Check multiple required roles (user needs at least one)
  if (requiredRoles && !requiredRoles.some(role => checkRole(role))) {
    if (showError) {
      return fallback || <ErrorMessage message="Você não tem permissão para acessar este conteúdo." />
    }
    return fallback || null
  }

  // User has required permissions
  return <>{children}</>
}

/**
 * Component that shows content only to admins
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="admin" fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that shows content only to braiders
 */
export function BraiderOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="braider" fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that shows content only to customers
 */
export function CustomerOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="customer" fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that shows content to admins and braiders
 */
export function AdminOrBraiderOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["admin", "braider"]} fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  )
}