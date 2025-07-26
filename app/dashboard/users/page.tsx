"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield, 
  Crown, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  TrendingUp,
  Download,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  ShoppingBag,
  Heart,
  Plus,
  Ban,
  Settings,
  Activity,
  Award,
  Target
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Mock user data - In a real app, this would come from your API
const mockUsers = [
  {
    id: "user-1700000000001",
    name: "Maria Silva",
    email: "maria.silva@email.com",
    phone: "+351 912 345 678",
    avatar: "/placeholder.svg?height=60&width=60&text=MS",
    role: "customer",
    status: "active",
    joinDate: "2024-01-15",
    lastLogin: "2024-01-20",
    orders: 12,
    totalSpent: 450.50,
    location: "Lisboa, Portugal",
    verified: true,
    favorites: 8,
    rating: 4.8
  },
  {
    id: "user-1700000000002", 
    name: "Ana Costa",
    email: "ana.costa@email.com",
    phone: "+351 913 456 789",
    avatar: "/placeholder.svg?height=60&width=60&text=AC",
    role: "customer",
    status: "active",
    joinDate: "2024-01-10",
    lastLogin: "2024-01-19",
    orders: 8,
    totalSpent: 320.00,
    location: "Porto, Portugal",
    verified: true,
    favorites: 15,
    rating: 4.9
  },
  {
    id: "user-1700000000003",
    name: "Sofia Santos",
    email: "sofia.santos@email.com", 
    phone: "+351 914 567 890",
    avatar: "/placeholder.svg?height=60&width=60&text=SS",
    role: "braider",
    status: "active",
    joinDate: "2024-01-05",
    lastLogin: "2024-01-20",
    orders: 45,
    totalSpent: 0,
    location: "Braga, Portugal",
    verified: true,
    favorites: 0,
    rating: 4.7
  },
  {
    id: "user-1700000000004",
    name: "João Admin",
    email: "admin@wilnaratrancas.com",
    phone: "+351 915 678 901",
    avatar: "/placeholder.svg?height=60&width=60&text=JA",
    role: "admin",
    status: "active",
    joinDate: "2023-12-01",
    lastLogin: "2024-01-20",
    orders: 0,
    totalSpent: 0,
    location: "Lisboa, Portugal",
    verified: true,
    favorites: 0,
    rating: 5.0
  },
  {
    id: "user-1700000000005",
    name: "Carla Ferreira",
    email: "carla.ferreira@email.com",
    phone: "+351 916 789 012",
    avatar: "/placeholder.svg?height=60&width=60&text=CF",
    role: "customer",
    status: "suspended",
    joinDate: "2024-01-12",
    lastLogin: "2024-01-18",
    orders: 3,
    totalSpent: 85.50,
    location: "Coimbra, Portugal",
    verified: false,
    favorites: 2,
    rating: 3.5
  },
  {
    id: "user-1700000000006",
    name: "Rita Oliveira",
    email: "rita.oliveira@email.com",
    phone: "+351 917 890 123",
    avatar: "/placeholder.svg?height=60&width=60&text=RO",
    role: "braider",
    status: "pending",
    joinDate: "2024-01-18",
    lastLogin: "2024-01-19",
    orders: 0,
    totalSpent: 0,
    location: "Faro, Portugal",
    verified: false,
    favorites: 0,
    rating: 0
  }
]

type User = typeof mockUsers[0]

export default function DashboardUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name-asc")

  useEffect(() => {
    let filtered = users

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "date-desc":
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
        case "date-asc":
          return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
        case "spent-desc":
          return b.totalSpent - a.totalSpent
        case "spent-asc":
          return a.totalSpent - b.totalSpent
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter, sortBy])

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: newStatus } : u
    ))
    setLoading(false)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
  }

  // Calculate metrics
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const pendingUsers = users.filter(u => u.status === 'pending').length
  const suspendedUsers = users.filter(u => u.status === 'suspended').length
  const customerUsers = users.filter(u => u.role === 'customer').length
  const braiderUsers = users.filter(u => u.role === 'braider').length
  const adminUsers = users.filter(u => u.role === 'admin').length
  const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-purple-600" />
      case "braider":
        return <Award className="h-4 w-4 text-blue-600" />
      case "customer":
        return <Users className="h-4 w-4 text-green-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "braider":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "customer":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "suspended":
        return <Ban className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador"
      case "braider": return "Trancista"
      case "customer": return "Cliente"
      default: return role
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo"
      case "pending": return "Pendente"
      case "suspended": return "Suspenso"
      default: return status
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Gestão de Usuários 👥
                </h1>
                <p className="text-white/90 text-lg">
                  Gerencie todos os usuários da plataforma
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Clientes, trancistas e administradores
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalUsers}</div>
              <div className="text-white/80 font-medium">Total de Usuários</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{activeUsers}</div>
              <div className="text-white/80 text-sm">Ativos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{customerUsers}</div>
              <div className="text-white/80 text-sm">Clientes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{braiderUsers}</div>
              <div className="text-white/80 text-sm">Trancistas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</div>
              <div className="text-white/80 text-sm">Receita Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                +12%
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
              <p className="text-sm text-green-600 font-medium">vs período anterior</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {customerUsers} novos
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{customerUsers}</p>
              <p className="text-sm text-blue-600 font-medium">usuários registrados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                Profissionais
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Trancistas</p>
              <p className="text-3xl font-bold text-gray-900">{braiderUsers}</p>
              <p className="text-sm text-purple-600 font-medium">prestadores ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                {pendingUsers > 0 ? "Atenção" : "OK"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-gray-900">{pendingUsers}</p>
              <p className="text-sm text-yellow-600 font-medium">aguardando aprovação</p>
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
                Use os filtros abaixo para encontrar usuários específicos
              </CardDescription>
            </div>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
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
              <label className="text-sm font-medium text-gray-700">Papel</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Papéis</SelectItem>
                  <SelectItem value="customer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      Clientes
                    </div>
                  </SelectItem>
                  <SelectItem value="braider">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-600" />
                      Trancistas
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-600" />
                      Administradores
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="suspended">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      Suspenso
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
                  <SelectItem value="spent-desc">Maior Gasto</SelectItem>
                  <SelectItem value="spent-asc">Menor Gasto</SelectItem>
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

      {/* Users List */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900">
            Lista de Usuários ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            {filteredUsers.length !== users.length ? 
              `Mostrando ${filteredUsers.length} de ${users.length} usuários` :
              `Todos os ${users.length} usuários cadastrados`
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all" ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all" ? 
                  "Tente ajustar os filtros de pesquisa" : 
                  "Os usuários aparecerão aqui conforme se registrarem"
                }
              </p>
              {(searchTerm || roleFilter !== "all" || statusFilter !== "all") ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setRoleFilter("all")
                    setStatusFilter("all")
                  }}
                  className="rounded-xl"
                >
                  Limpar Filtros
                </Button>
              ) : (
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Usuário
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="group p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={60}
                          height={60}
                          className="rounded-full object-cover border-3 border-white shadow-lg"
                          unoptimized={true}
                        />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center",
                          user.status === 'active' && "bg-green-500",
                          user.status === 'pending' && "bg-yellow-500",
                          user.status === 'suspended' && "bg-red-500"
                        )}>
                          {getStatusIcon(user.status)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {user.name}
                          </h4>
                          {user.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                          <Badge variant="secondary" className={cn("text-xs", getRoleBadgeClass(user.role))}>
                            <span className="flex items-center gap-1">
                              {getRoleIcon(user.role)}
                              {getRoleLabel(user.role)}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {user.location}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Cadastrado em {new Date(user.joinDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Último acesso: {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <Badge variant="secondary" className={cn("text-sm mb-2", getStatusBadgeClass(user.status))}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(user.status)}
                            {getStatusLabel(user.status)}
                          </span>
                        </Badge>
                        <p className="text-xs text-gray-500">
                          ID: {user.id.split("-")[1]}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white/80 rounded-xl">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                        <ShoppingBag className="h-4 w-4" />
                        {user.orders}
                      </div>
                      <p className="text-xs text-gray-600">Pedidos</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-emerald-600">
                        <Target className="h-4 w-4" />
                        €{user.totalSpent.toFixed(0)}
                      </div>
                      <p className="text-xs text-gray-600">Gasto Total</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-purple-600">
                        <Heart className="h-4 w-4" />
                        {user.favorites}
                      </div>
                      <p className="text-xs text-gray-600">Favoritos</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-yellow-600">
                        <Star className="h-4 w-4 fill-current" />
                        {user.rating.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-600">Avaliação</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Ações:</span>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                        <Link href={`/dashboard/users/${user.id}` as any}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Link>
                      </Button>
                      
                      <Button variant="outline" size="sm" className="rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      
                      {user.status === "suspended" ? (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateUserStatus(user.id, "active")}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                          disabled={loading}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reativar
                        </Button>
                      ) : user.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateUserStatus(user.id, "suspended")}
                          className="rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                          disabled={loading}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspender
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateUserStatus(user.id, "active")}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                          disabled={loading}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Ativar
                        </Button>
                      )}
                      
                      {user.role !== "admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
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