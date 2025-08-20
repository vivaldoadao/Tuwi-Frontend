"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  TrendingUp,
  UserCheck,  
  Award
} from "lucide-react"
import { UsersTable } from "@/components/users-table"
import { getAllUsersDjango } from "@/lib/data-django"
import { useAdminGuard } from "@/hooks/use-admin-guard"
import { toast } from "react-hot-toast"

export default function DashboardUsersPage() {
  const { isAdmin, isLoading: authLoading } = useAdminGuard()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    customerUsers: 0,
    braiderUsers: 0,
    adminUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !isAdmin) {
        setLoading(false)
        return
      }

      try {
        // Fetch first page to get stats from Django
        const response = await getAllUsersDjango(1, 100)
        
        setStats({
          totalUsers: response.stats.total_users,
          activeUsers: response.stats.active_users,
          customerUsers: response.stats.customer_users,
          braiderUsers: response.stats.braider_users,
          adminUsers: response.stats.admin_users
        })
      } catch (error) {
        console.error('Error fetching user stats from Django:', error)
        toast.error('Erro ao carregar estatísticas de usuários')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [authLoading, isAdmin])

  return (
    <div className="w-full max-w-full space-y-8">
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
              <div className="text-3xl font-bold">{loading ? "..." : stats.totalUsers}</div>
              <div className="text-white/80 font-medium">Total de Usuários</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? "..." : stats.activeUsers}</div>
              <div className="text-white/80 text-sm">Ativos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? "..." : stats.customerUsers}</div>
              <div className="text-white/80 text-sm">Clientes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? "..." : stats.braiderUsers}</div>
              <div className="text-white/80 text-sm">Trancistas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? "..." : stats.adminUsers}</div>
              <div className="text-white/80 text-sm">Admins</div>
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
                Online
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? "..." : stats.activeUsers}</p>
              <p className="text-sm text-green-600 font-medium">usuários conectados</p>
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
                Crescendo
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? "..." : stats.customerUsers}</p>
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
              <p className="text-3xl font-bold text-gray-900">{loading ? "..." : stats.braiderUsers}</p>
              <p className="text-sm text-purple-600 font-medium">prestadores ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                Total
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Todos os Usuários</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? "..." : stats.totalUsers}</p>
              <p className="text-sm text-orange-600 font-medium">na plataforma</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <div className="w-full">
        <UsersTable />
      </div>
    </div>
  )
}