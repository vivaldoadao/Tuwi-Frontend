"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  UserCheck,
  Shield,
  User,
  Eye,
  Ban,
  CheckCircle,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { getAllUsersDjango, convertDjangoUserToFrontend, updateUserRoleDjango, toggleUserStatusDjango, deleteUserDjango } from "@/lib/data-django"
import { type User as UserType } from "@/lib/data-supabase"
import { EditUserForm } from "@/components/edit-user-form"
import { toast } from "react-hot-toast"

export function UsersTable() {
  const [users, setUsers] = React.useState<UserType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalUsers, setTotalUsers] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  const usersPerPage = 10

  const fetchUsers = React.useCallback(async (page: number = 1, search?: string) => {
    setLoading(true)
    try {
      const response = await getAllUsersDjango(page, usersPerPage, search || '')
      
      // Convert Django users to frontend format
      const convertedUsers = response.users.map(convertDjangoUserToFrontend)
      
      setUsers(convertedUsers)
      setTotalUsers(response.pagination.total)
      setHasMore(response.pagination.has_next)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching users from Django:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUsers(1, searchQuery)
  }, [fetchUsers, searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchUsers(currentPage - 1, searchQuery)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      fetchUsers(currentPage + 1, searchQuery)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'braider' | 'admin') => {
    if (!userId || userId === 'undefined') {
      toast.error('Erro: ID do usuário inválido')
      return
    }

    setActionLoading(userId)
    try {
      const { success, error } = await updateUserRoleDjango(userId, newRole)
      if (success) {
        toast.success('Papel do usuário atualizado com sucesso')
        fetchUsers(currentPage, searchQuery) // Refresh current page
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
    if (!userId || userId === 'undefined') {
      toast.error('Erro: ID do usuário inválido')
      return
    }

    setActionLoading(userId)
    try {
      const { success, error } = await toggleUserStatusDjango(userId)
      if (success) {
        toast.success('Status do usuário alterado com sucesso')
        fetchUsers(currentPage, searchQuery) // Refresh current page
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

  const handleViewDetails = (userId: string) => {
    window.location.href = `/dashboard/users/${userId}`
  }

  const handleUserUpdated = (updatedUser: UserType) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    )
  }

  const handleCascadeTest = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const confirmDelete = confirm(
      `⚠️ DELETAR USUÁRIO\n\n` +
      `Isso vai DELETAR permanentemente o usuário:\n` +
      `${user.name} (${user.email})\n\n` +
      `Esta ação NÃO pode ser desfeita!\n\n` +
      `Continuar?`
    )

    if (!confirmDelete) return

    setActionLoading(userId)
    try {
      const result = await deleteUserDjango(userId)
      
      if (result.success) {
        // Remove user from local state
        setUsers(users.filter(u => u.id !== userId))
        setTotalUsers(prev => prev - 1)
        
        // Show success message
        toast.success(result.message || 'Usuário deletado com sucesso!')
        
        if (result.cascadeTest) {
          console.log('CASCADE TEST RESULT:', result.cascadeTest)
        }
      } else {
        toast.error(result.error || 'Erro ao deletar usuário')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erro ao deletar usuário')
    } finally {
      setActionLoading(null)
    }
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
      <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Inativo</Badge>
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

  const totalPages = Math.ceil(totalUsers / usersPerPage)

  return (
    <div>
      <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold font-heading text-gray-900">
              <Users className="h-5 w-5" />
              Usuários da Plataforma
            </CardTitle>
            <CardDescription>
              Gerencie todos os usuários, papéis e permissões do sistema
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalUsers} usuários
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome ou email..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900 w-1/4">Usuário</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Papel</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Data de Registro</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Último Login</TableHead>
                <TableHead className="text-center font-semibold text-gray-900 w-1/6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: usersPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-6 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user, index) => {
                  // Capture variables to prevent closure issues
                  const userIdCapture = String(user.id)
                  const userRoleCapture = user.role
                  const userIsActiveCapture = user.isActive
                  
                  return (
                  <TableRow key={user.id || `fallback-${index}`} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.isActive)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === user.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* Ver Detalhes */}
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          {/* Editar Usuario */}
                          <DropdownMenuItem asChild>
                            <EditUserForm 
                              user={user} 
                              onUserUpdated={handleUserUpdated}
                              trigger={
                                <div className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Dados
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Alterar Permissões</DropdownMenuLabel>
                          
                          {/* Mudança de Papéis */}
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(userIdCapture, 'customer')}
                            disabled={userRoleCapture === 'customer'}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Definir como Cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(userIdCapture, 'braider')}
                            disabled={userRoleCapture === 'braider'}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Definir como Trancista
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(userIdCapture, 'admin')}
                            disabled={userRoleCapture === 'admin'}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Definir como Admin
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status da Conta</DropdownMenuLabel>
                          
                          {/* Ativar/Desativar */}
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(userIdCapture)}
                            className={userIsActiveCapture ? "text-red-600" : "text-green-600"}
                          >
                            {userIsActiveCapture ? (
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
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-orange-600">🧪 Testes (Admin)</DropdownMenuLabel>
                          
                          {/* Teste de Cascade */}
                          <DropdownMenuItem 
                            onClick={() => handleCascadeTest(userIdCapture)}
                            className="text-orange-600 hover:bg-orange-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium text-lg">
                      {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery 
                        ? 'Tente ajustar os termos de pesquisa' 
                        : 'Os usuários aparecerão aqui conforme se registrarem'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalUsers > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * usersPerPage) + 1} a {Math.min(currentPage * usersPerPage, totalUsers)} de {totalUsers} usuários
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="h-8"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}