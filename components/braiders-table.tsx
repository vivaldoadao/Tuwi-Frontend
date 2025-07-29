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
  UserX,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Star,
  Award,
  Mail,
  Phone
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { getAllBraiders, updateBraiderStatus, toggleBraiderAccount, type Braider } from "@/lib/data-supabase"
import { EditBraiderForm } from "@/components/edit-braider-form"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function BraidersTable() {
  const router = useRouter()
  const [braiders, setBraiders] = React.useState<Braider[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalBraiders, setTotalBraiders] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  const braidersPerPage = 10

  const fetchBraiders = React.useCallback(async (page: number = 1, search?: string, status?: string) => {
    setLoading(true)
    try {
      const { braiders: fetchedBraiders, total, hasMore: moreBraiders } = await getAllBraiders(
        page, 
        braidersPerPage, 
        search,
        status === 'all' ? undefined : status
      )
      setBraiders(fetchedBraiders)
      setTotalBraiders(total)
      setHasMore(moreBraiders)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching braiders:', error)
      toast.error('Erro ao carregar trancistas')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBraiders(1, searchQuery, statusFilter)
  }, [fetchBraiders, searchQuery, statusFilter])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchBraiders(currentPage - 1, searchQuery, statusFilter)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      fetchBraiders(currentPage + 1, searchQuery, statusFilter)
    }
  }

  const handleStatusChange = async (braiderId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    setActionLoading(braiderId)
    try {
      const { success, error } = await updateBraiderStatus(braiderId, newStatus)
      if (success) {
        toast.success('Status da trancista atualizado com sucesso')
        fetchBraiders(currentPage, searchQuery, statusFilter) // Refresh current page
      } else {
        toast.error(error || 'Erro ao atualizar status da trancista')
      }
    } catch (error) {
      console.error('Error updating braider status:', error)
      toast.error('Erro inesperado ao atualizar status da trancista')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (braiderId: string) => {
    console.log('Navigating to braider details:', braiderId)
    try {
      router.push(`/dashboard/braiders/${braiderId}`)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location
      window.location.href = `/dashboard/braiders/${braiderId}`
    }
  }

  const handleToggleAccount = async (braiderId: string) => {
    setActionLoading(braiderId)
    try {
      const { success, error, isActive } = await toggleBraiderAccount(braiderId)
      if (success) {
        toast.success(isActive ? 'Conta ativada com sucesso' : 'Conta desativada com sucesso')
        fetchBraiders(currentPage, searchQuery, statusFilter) // Refresh current page
      } else {
        toast.error(error || 'Erro ao alterar status da conta')
      }
    } catch (error) {
      console.error('Error toggling account:', error)
      toast.error('Erro inesperado ao alterar status da conta')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBraiderUpdated = (updatedBraider: Braider) => {
    setBraiders(prevBraiders => 
      prevBraiders.map(braider => 
        braider.id === updatedBraider.id ? updatedBraider : braider
      )
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprovada</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const totalPages = Math.ceil(totalBraiders / braidersPerPage)

  return (
    <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold font-heading text-gray-900">
              <Users className="h-5 w-5" />
              Trancistas da Plataforma
            </CardTitle>
            <CardDescription>
              Gerencie todas as trancistas, aprovações e perfis
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalBraiders} trancistas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome, email ou localização..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Pendente
                </div>
              </SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Aprovada
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Rejeitada
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Braiders Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900 w-1/3">Trancista</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Serviços</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Avaliação</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Data Registro</TableHead>
                <TableHead className="text-center font-semibold text-gray-900 w-1/6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: braidersPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="animate-pulse">
                          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-12"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : braiders.length > 0 ? (
                braiders.map((braider) => (
                  <TableRow key={braider.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={braider.profileImageUrl || "/placeholder.svg?height=48&width=48&text=T"}
                            alt={braider.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                            unoptimized={true}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            braider.status === 'approved' ? 'bg-green-500' : 
                            braider.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{braider.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {braider.location}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {braider.contactEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(braider.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Award className="h-4 w-4 text-purple-600" />
                        {braider.services?.length || 0} serviços
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        {braider.averageRating?.toFixed(1) || '0.0'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(braider.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === braider.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Ações da Trancista</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* Ver Detalhes */}
                          <DropdownMenuItem onClick={() => handleViewDetails(braider.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil Completo
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                          
                          {/* Status Actions */}
                          {braider.status !== 'approved' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(braider.id, 'approved')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar Trancista
                            </DropdownMenuItem>
                          )}
                          
                          {braider.status !== 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(braider.id, 'pending')}
                              className="text-yellow-600"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Marcar como Pendente
                            </DropdownMenuItem>
                          )}
                          
                          {braider.status !== 'rejected' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(braider.id, 'rejected')}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar Trancista
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Gestão da Conta</DropdownMenuLabel>
                          
                          {/* Edit Profile */}
                          <DropdownMenuItem asChild>
                            <EditBraiderForm 
                              braider={braider}
                              onBraiderUpdated={handleBraiderUpdated}
                              trigger={
                                <div className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Perfil
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                          
                          {/* Toggle Account */}
                          <DropdownMenuItem 
                            onClick={() => handleToggleAccount(braider.id)}
                            className="text-orange-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Desativar/Ativar Conta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium text-lg">
                      {searchQuery || statusFilter !== 'all' ? 'Nenhuma trancista encontrada' : 'Nenhuma trancista cadastrada'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Tente ajustar os termos de pesquisa' 
                        : 'As trancistas aparecerão aqui conforme se registrarem'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalBraiders > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * braidersPerPage) + 1} a {Math.min(currentPage * braidersPerPage, totalBraiders)} de {totalBraiders} trancistas
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
  )
}