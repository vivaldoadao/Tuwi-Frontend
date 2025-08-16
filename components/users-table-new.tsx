// ===================================
// USERS TABLE - NOVA VERSÃO COM DATATABLE
// ===================================

"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Shield,
  UserCheck,
  User,
  Eye,
  Ban,
  CheckCircle,
  Edit,
  Trash2
} from "lucide-react"
import { DataTable } from "@/components/data-table"
import { EditUserForm } from "@/components/edit-user-form"
import { 
  getAllUsers, 
  updateUserRole, 
  toggleUserStatus, 
  type User as UserType 
} from "@/lib/data-supabase"
import { deleteUserCascadeTest } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import type { TableColumn, TableAction } from "@/types/table"

export function UsersTableNew() {
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  // Fetch function compatible with DataTable
  const fetchUsers = React.useCallback(async (
    page: number, 
    limit: number, 
    filters: any, 
    sorting: any
  ) => {
    const { users, total, hasMore } = await getAllUsers(page, limit, filters?.search)
    return {
      items: users,
      total,
      hasMore
    }
  }, [])

  // Column definitions
  const columns: TableColumn<UserType>[] = [
    {
      key: 'name',
      label: 'Usuário',
      sortable: true,
      render: (value, user) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          {user.phone && (
            <div className="text-xs text-gray-400">{user.phone}</div>
          )}
        </div>
      )
    },
    {
      key: 'role',
      label: 'Papel',
      sortable: true,
      render: (value) => getRoleBadge(value as string)
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value as boolean)
    },
    {
      key: 'createdAt',
      label: 'Data de Registro',
      sortable: true,
      render: (value) => formatDate(value as string)
    },
    {
      key: 'lastLogin',
      label: 'Último Login',
      sortable: true,
      render: (value) => value ? formatDate(value as string) : 'Nunca'
    }
  ]

  // Action definitions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'Ver Detalhes',
      icon: Eye
    },
    {
      key: 'edit',
      label: 'Editar Dados',
      icon: Edit
    },
    {
      separator: true
    },
    {
      label: 'Alterar Permissões'
    },
    {
      key: 'role-customer',
      label: 'Definir como Cliente',
      icon: User
    },
    {
      key: 'role-braider',
      label: 'Definir como Trancista',
      icon: UserCheck
    },
    {
      key: 'role-admin',
      label: 'Definir como Admin',
      icon: Shield
    },
    {
      separator: true
    },
    {
      label: 'Status da Conta'
    },
    {
      key: 'toggle-status',
      label: 'Ativar/Desativar',
      icon: Ban
    },
    {
      separator: true
    },
    {
      label: '🧪 Testes (Admin)',
      className: 'text-orange-600'
    },
    {
      key: 'cascade-test',
      label: 'Testar Cascade Delete',
      icon: Trash2,
      className: 'text-orange-600 hover:bg-orange-50'
    }
  ]

  // Action handler
  const handleAction = React.useCallback(async (action: string, user: UserType) => {
    switch (action) {
      case 'view':
        handleViewDetails(user.id)
        break
      case 'edit':
        // EditUserForm will handle this via trigger
        break
      case 'role-customer':
        handleRoleChange(user.id, 'customer')
        break
      case 'role-braider':
        handleRoleChange(user.id, 'braider')
        break
      case 'role-admin':
        handleRoleChange(user.id, 'admin')
        break
      case 'toggle-status':
        handleToggleStatus(user.id)
        break
      case 'cascade-test':
        handleCascadeTest(user.id)
        break
    }
  }, [])

  // Action functions
  const handleViewDetails = (userId: string) => {
    window.location.href = `/dashboard/users/${userId}`
  }

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'braider' | 'admin') => {
    setActionLoading(userId)
    try {
      const { success, error } = await updateUserRole(userId, newRole)
      if (success) {
        toast.success('Papel do usuário atualizado com sucesso')
        // DataTable will auto-refresh via dependencies
      } else {
        toast.error(error || 'Erro ao atualizar papel do usuário')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Erro inesperado ao atualizar papel do usuário')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { success, error } = await toggleUserStatus(userId)
      if (success) {
        toast.success('Status do usuário alterado com sucesso')
        // DataTable will auto-refresh via dependencies
      } else {
        toast.error(error || 'Erro ao alterar status do usuário')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Erro inesperado ao alterar status do usuário')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCascadeTest = async (userId: string) => {
    // Find user in current data for confirmation
    const confirmDelete = confirm(
      `⚠️ TESTE DE CASCADE\n\n` +
      `Isso vai DELETAR permanentemente o usuário.\n\n` +
      `E testar se o perfil de trancista é deletado automaticamente.\n\n` +
      `Esta ação NÃO pode ser desfeita!\n\n` +
      `Continuar?`
    )

    if (!confirmDelete) return

    setActionLoading(userId)
    try {
      const result = await deleteUserCascadeTest(userId)
      
      if (result.success) {
        toast.success(
          `✅ ${result.message}\n\n` +
          `Teste de Cascade:\n` +
          `• Usuário deletado: ${result.cascadeTest.userDeleted ? 'Sim' : 'Não'}\n` +
          `• Tinha perfil trancista: ${result.cascadeTest.hadBraiderProfile ? 'Sim' : 'Não'}\n` +
          `• ID do braider: ${result.cascadeTest.braiderId || 'N/A'}`,
          { duration: 8000 }
        )
        console.log('CASCADE TEST RESULT:', result.cascadeTest)
        // DataTable will auto-refresh via dependencies
      } else {
        toast.error(`Erro: ${result.message}`)
      }
    } catch (error) {
      console.error('Error testing cascade deletion:', error)
      toast.error('Erro ao testar deleção em cascade')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <DataTable<UserType>
      fetchFunction={fetchUsers}
      columns={columns}
      actions={actions}
      title="Usuários da Plataforma"
      description="Gerencie todos os usuários, papéis e permissões do sistema"
      icon={Users}
      totalLabel="usuários"
      searchPlaceholder="Pesquisar por nome ou email..."
      emptyIcon={Users}
      emptyTitle="Nenhum usuário encontrado"
      emptyDescription="Os usuários aparecerão aqui conforme se registrarem"
      onAction={handleAction}
      dependencies={[actionLoading]} // Refresh when actions complete
    />
  )
}

// Helper functions
function getRoleBadge(role: string) {
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

function getStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>
  ) : (
    <Badge variant="secondary" className="bg-red-100 text-red-800">Inativo</Badge>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}