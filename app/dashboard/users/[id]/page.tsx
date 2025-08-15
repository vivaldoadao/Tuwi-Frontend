"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  Activity,
  Clock,
  Ban,
  CheckCircle
} from "lucide-react"
import { getUserById, updateUserRole, toggleUserStatus, type User as UserType } from "@/lib/data-supabase"
import { EditUserForm } from "@/components/edit-user-form"
import { toast } from "react-hot-toast"
import Link from "next/link"

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string
  
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(userId)
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId])

  const handleRoleChange = async (newRole: 'customer' | 'braider' | 'admin') => {
    if (!user) return
    
    setActionLoading(true)
    try {
      const { success, error } = await updateUserRole(user.id, newRole)
      if (success) {
        setUser({ ...user, role: newRole })
        toast.success('Papel do usuário atualizado com sucesso')
      } else {
        toast.error(error || 'Erro ao atualizar papel do usuário')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Erro inesperado ao atualizar papel do usuário')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!user) return
    
    setActionLoading(true)
    try {
      const { success, error } = await toggleUserStatus(user.id)
      if (success) {
        setUser({ ...user, isActive: !user.isActive })
        toast.success('Status do usuário alterado com sucesso')
      } else {
        toast.error(error || 'Erro ao alterar status do usuário')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Erro inesperado ao alterar status do usuário')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserUpdated = (updatedUser: UserType) => {
    setUser(updatedUser)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'braider':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800"><UserCheck className="h-3 w-3 mr-1" />Trancista</Badge>
      case 'customer':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><User className="h-3 w-3 mr-1" />Cliente</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <Ban className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Usuário não encontrado</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">Usuário não encontrado</p>
            <p className="text-gray-400 text-sm mb-6">O usuário pode ter sido removido ou o ID é inválido</p>
            <Button asChild>
              <Link href="/dashboard/users">Voltar à Lista</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Usuário</h1>
            <p className="text-gray-600">Informações completas e ações administrativas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getRoleBadge(user.role)}
          {getStatusBadge(user.isActive)}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {user.name}
              </CardTitle>
              <CardDescription>ID: {user.id}</CardDescription>
            </div>
            <EditUserForm user={user} onUserUpdated={handleUserUpdated} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Informações Básicas</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Papel</p>
                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-1">{getStatusBadge(user.isActive)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de Data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Datas Importantes</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Data de Registro</p>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Último Login</p>
                    <p className="font-medium">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Nunca fez login'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Administrativas</CardTitle>
          <CardDescription>
            Altere as permissões e status do usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Role Management */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Alterar Papel do Usuário</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={user.role === 'customer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleChange('customer')}
                  disabled={actionLoading || user.role === 'customer'}
                >
                  <User className="h-4 w-4 mr-2" />
                  Cliente
                </Button>
                <Button
                  variant={user.role === 'braider' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleChange('braider')}
                  disabled={actionLoading || user.role === 'braider'}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Trancista
                </Button>
                <Button
                  variant={user.role === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleChange('admin')}
                  disabled={actionLoading || user.role === 'admin'}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </div>
            </div>

            {/* Status Management */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Status da Conta</h4>
              <Button
                variant={user.isActive ? 'destructive' : 'default'}
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                {user.isActive ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Desativar Usuário
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ativar Usuário
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}