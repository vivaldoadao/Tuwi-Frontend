"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllBraiders, updateBraiderStatus, type Braider } from "@/lib/data"
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Award,
  TrendingUp,
  Download,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Plus
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DashboardBraidersPage() {
  const [braiders, setBraiders] = useState<Braider[]>([])
  const [filteredBraiders, setFilteredBraiders] = useState<Braider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name-asc")

  useEffect(() => {
    const fetchBraiders = async () => {
      setLoading(true)
      const fetchedBraiders = await getAllBraiders()
      setBraiders(fetchedBraiders)
      setFilteredBraiders(fetchedBraiders)
      setLoading(false)
    }
    fetchBraiders()
  }, [])

  // Filter and search braiders
  useEffect(() => {
    let filtered = braiders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(braider => 
        braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        braider.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        braider.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(braider => braider.status === statusFilter)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "date-desc":
          return new Date(b.id).getTime() - new Date(a.id).getTime()
        case "date-asc":
          return new Date(a.id).getTime() - new Date(b.id).getTime()
        default:
          return 0
      }
    })

    setFilteredBraiders(filtered)
  }, [braiders, searchTerm, statusFilter, sortBy])

  const handleUpdateStatus = async (braiderId: string, newStatus: Braider["status"]) => {
    setLoading(true)
    const result = await updateBraiderStatus(braiderId, newStatus)
    if (result.success) {
      setBraiders(prev => prev.map(b => 
        b.id === braiderId ? { ...b, status: newStatus } : b
      ))
    }
    setLoading(false)
  }

  // Calculate metrics
  const totalBraiders = braiders.length
  const pendingBraiders = braiders.filter(b => b.status === 'pending').length
  const approvedBraiders = braiders.filter(b => b.status === 'approved').length
  const rejectedBraiders = braiders.filter(b => b.status === 'rejected').length
  const approvalRate = totalBraiders > 0 ? Math.round((approvedBraiders / totalBraiders) * 100) : 0

  const getStatusIcon = (status: Braider["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeClass = (status: Braider["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusLabel = (status: Braider["status"]) => {
    switch (status) {
      case "approved": return "Aprovada"
      case "pending": return "Pendente"
      case "rejected": return "Rejeitada"
      default: return status
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Gestão de Trancistas 👩‍🦱
                </h1>
                <p className="text-white/90 text-lg">
                  Gerencie solicitações e aprove novos profissionais
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Sistema completo de aprovação e monitoramento
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalBraiders}</div>
              <div className="text-white/80 font-medium">Total de Trancistas</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{pendingBraiders}</div>
              <div className="text-white/80 text-sm">Pendentes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{approvedBraiders}</div>
              <div className="text-white/80 text-sm">Aprovadas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{rejectedBraiders}</div>
              <div className="text-white/80 text-sm">Rejeitadas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{approvalRate}%</div>
              <div className="text-white/80 text-sm">Taxa Aprovação</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                Urgente
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Pendentes de Aprovação</p>
              <p className="text-3xl font-bold text-gray-900">{pendingBraiders}</p>
              <p className="text-sm text-yellow-600 font-medium">requer atenção</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Ativo
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Trancistas Aprovadas</p>
              <p className="text-3xl font-bold text-gray-900">{approvedBraiders}</p>
              <p className="text-sm text-green-600 font-medium">profissionais ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <UserX className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                Inativo
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Solicitações Rejeitadas</p>
              <p className="text-3xl font-bold text-gray-900">{rejectedBraiders}</p>
              <p className="text-sm text-red-600 font-medium">não aprovadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {approvalRate > 70 ? "Alto" : approvalRate > 40 ? "Médio" : "Baixo"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
              <p className="text-3xl font-bold text-gray-900">{approvalRate}%</p>
              <p className="text-sm text-blue-600 font-medium">histórico geral</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros e Pesquisa
              </CardTitle>
              <CardDescription>
                Use os filtros abaixo para encontrar trancistas específicas
              </CardDescription>
            </div>
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl shadow-lg">
              <Link href="/register-braider">
                <Plus className="h-4 w-4 mr-2" />
                Nova Trancista
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, email ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="date-desc">Mais Recente</SelectItem>
                  <SelectItem value="date-asc">Mais Antigo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ações</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-xl">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Braiders List */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900">
            Lista de Trancistas ({filteredBraiders.length})
          </CardTitle>
          <CardDescription>
            {filteredBraiders.length !== braiders.length ? 
              `Mostrando ${filteredBraiders.length} de ${braiders.length} trancistas` :
              `Todas as ${braiders.length} trancistas cadastradas`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : filteredBraiders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">
                {searchTerm || statusFilter !== "all" ? "Nenhuma trancista encontrada" : "Nenhuma trancista cadastrada"}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {searchTerm || statusFilter !== "all" ? 
                  "Tente ajustar os filtros de pesquisa" : 
                  "As solicitações de trancistas aparecerão aqui"
                }
              </p>
              {(searchTerm || statusFilter !== "all") ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                  className="rounded-xl"
                >
                  Limpar Filtros
                </Button>
              ) : (
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl">
                  <Link href="/register-braider">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeira Trancista
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBraiders.map((braider) => (
                <div
                  key={braider.id}
                  className="group p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Image
                          src={braider.profileImageUrl || "/placeholder.svg?height=80&width=80&text=T"}
                          alt={braider.name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover border-4 border-white shadow-lg"
                          unoptimized={true}
                        />
                        <div className={cn(
                          "absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center",
                          braider.status === 'approved' && "bg-green-500",
                          braider.status === 'pending' && "bg-yellow-500",
                          braider.status === 'rejected' && "bg-red-500"
                        )}>
                          {getStatusIcon(braider.status)}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {braider.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {braider.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {braider.contactEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {braider.contactPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {braider.services.length} serviços
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            4.8 (12 avaliações)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <Badge variant="secondary" className={cn("text-sm mb-2", getStatusBadgeClass(braider.status))}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(braider.status)}
                            {getStatusLabel(braider.status)}
                          </span>
                        </Badge>
                        <p className="text-xs text-gray-500">
                          ID: {braider.id.split("-")[1]}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>

                  {/* Bio Preview */}
                  <div className="mb-4 p-3 bg-white/80 rounded-xl">
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {braider.bio || "Sem biografia disponível"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Ações:</span>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                        <Link href={`/dashboard/braiders/${braider.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Link>
                      </Button>
                      
                      {braider.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(braider.id, "approved")}
                            className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUpdateStatus(braider.id, "rejected")}
                            className="rounded-xl"
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      
                      {braider.status === "rejected" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(braider.id, "approved")}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reativar
                        </Button>
                      )}
                      
                      {braider.status === "approved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(braider.id, "rejected")}
                          className="rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                          disabled={loading}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}