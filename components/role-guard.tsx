"use client"

import type React from "react"
import { useAuth } from "@/context/auth-context"
import { hasRole, hasRolePermission, type UserRole, USER_ROLES } from "@/lib/roles"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface RoleGuardProps {
  children: React.ReactNode
  role?: UserRole
  requireExact?: boolean
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * Component to protect content based on user roles
 * @param role - Required role (uses hierarchy by default)
 * @param requireExact - If true, requires exact role match (no hierarchy)
 * @param fallback - Custom component to show when access denied
 * @param redirectTo - URL to redirect to when access denied
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  requireExact = false,
  fallback,
  redirectTo
}) => {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // No session means no access
  if (!session?.user) {
    if (redirectTo) {
      router.push(redirectTo)
      return null
    }
    
    return fallback || <AccessDenied reason="Você precisa estar logado para acessar esta área." />
  }

  // No role required, just authentication
  if (!role) {
    return <>{children}</>
  }

  // Check role permission
  const hasAccess = requireExact 
    ? hasRole(session, role)
    : hasRolePermission(session, role)

  if (!hasAccess) {
    if (redirectTo) {
      router.push(redirectTo)
      return null
    }
    
    return fallback || <AccessDenied reason="Você não tem permissão para acessar esta área." />
  }

  return <>{children}</>
}

/**
 * Guard specifically for admin-only content
 */
export const AdminGuard: React.FC<Omit<RoleGuardProps, 'role'>> = (props) => (
  <RoleGuard {...props} role={USER_ROLES.ADMIN} requireExact />
)

/**
 * Guard specifically for braider-level content (braiders and admins)
 */
export const BraiderGuard: React.FC<Omit<RoleGuardProps, 'role'>> = (props) => (
  <RoleGuard {...props} role={USER_ROLES.BRAIDER} />
)

/**
 * Guard specifically for customer-level content (any authenticated user)
 */
export const CustomerGuard: React.FC<Omit<RoleGuardProps, 'role'>> = (props) => (
  <RoleGuard {...props} role={USER_ROLES.CUSTOMER} />
)

/**
 * Default access denied component
 */
const AccessDenied: React.FC<{ reason: string }> = ({ reason }) => {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Acesso Negado</CardTitle>
          <CardDescription className="text-gray-600">
            {reason}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}