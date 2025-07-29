"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BraidersTable } from "@/components/braiders-table"
import { getAllBraiders, type Braider } from "@/lib/data-supabase"
import { 
  Users, 
  Clock, 
  UserCheck, 
  UserX, 
  TrendingUp
} from "lucide-react"

export default function DashboardBraidersPage() {
  const [braiders, setBraiders] = useState<Braider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBraiders = async () => {
      setLoading(true)
      try {
        const { braiders: fetchedBraiders } = await getAllBraiders(1, 1000) // Get all braiders for stats
        setBraiders(fetchedBraiders)
      } catch (error) {
        console.error('Error fetching braiders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBraiders()
  }, [])

  // Calculate metrics
  const totalBraiders = braiders.length
  const pendingBraiders = braiders.filter(b => b.status === 'pending').length
  const approvedBraiders = braiders.filter(b => b.status === 'approved').length
  const rejectedBraiders = braiders.filter(b => b.status === 'rejected').length
  const approvalRate = totalBraiders > 0 ? Math.round((approvedBraiders / totalBraiders) * 100) : 0

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
              <div className="text-3xl font-bold">{loading ? '...' : totalBraiders}</div>
              <div className="text-white/80 font-medium">Total de Trancistas</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : pendingBraiders}</div>
              <div className="text-white/80 text-sm">Pendentes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : approvedBraiders}</div>
              <div className="text-white/80 text-sm">Aprovadas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : rejectedBraiders}</div>
              <div className="text-white/80 text-sm">Rejeitadas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : approvalRate}%</div>
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
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : pendingBraiders}</p>
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
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : approvedBraiders}</p>
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
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : rejectedBraiders}</p>
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
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : approvalRate}%</p>
              <p className="text-sm text-blue-600 font-medium">histórico geral</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Braiders Table */}
      <BraidersTable />
    </div>
  )
}