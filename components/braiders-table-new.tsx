// ===================================
// BRAIDERS TABLE - NOVA VERSÃO COM DATATABLE
// ===================================

"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { 
  UserCheck,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Star,
  Award,
  Mail
} from "lucide-react"
import { DataTable } from "@/components/data-table"
import { fetchBraidersAdmin, updateBraiderStatusAdmin, type BraiderAdmin } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { TableColumn, TableAction } from "@/types/table"

export function BraidersTableNew() {
  const router = useRouter()
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  // Fetch function compatible with DataTable
  const fetchBraiders = React.useCallback(async (
    page: number, 
    limit: number, 
    filters: any, 
    sorting: any
  ) => {
    const { braiders, total, hasMore } = await fetchBraidersAdmin(
      page, 
      limit, 
      filters?.search,
      filters?.status === 'all' ? undefined : filters?.status
    )
    return {
      items: braiders,
      total,
      hasMore
    }
  }, [])

  // Column definitions
  const columns: TableColumn<BraiderAdmin>[] = [
    {
      key: 'name',
      label: 'Trancista',
      sortable: true,
      render: (value, braider) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-gray-200">
            {braider.profileImage ? (
              <Image
                src={braider.profileImage}
                alt={braider.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{braider.name}</div>
            <div className="text-sm text-gray-500">{braider.email}</div>
            {braider.phone && (
              <div className="text-xs text-gray-400">{braider.phone}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value as string)
    },
    {
      key: 'location',
      label: 'Localização',
      sortable: true,
      render: (value, braider) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-3 w-3" />
          {braider.city ? `${braider.city}, ${braider.state}` : 'Não informado'}
        </div>
      )
    },
    {
      key: 'averageRating',
      label: 'Avaliação',
      sortable: true,
      render: (value, braider) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{value?.toFixed(1) || '0.0'}</span>
          <span className="text-sm text-gray-500">({braider.totalReviews || 0})</span>
        </div>
      )
    },
    {
      key: 'yearsExperience',
      label: 'Experiência',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-purple-600" />
          <span>{value || 0} anos</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Cadastro',
      sortable: true,
      render: (value) => formatDate(value as string)
    }
  ]

  // Action definitions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'Ver Perfil',
      icon: Eye
    },
    {
      key: 'edit',
      label: 'Editar Dados',
      icon: Edit
    },
    {
      key: 'contact',
      label: 'Enviar Email',
      icon: Mail
    },
    {
      separator: true
    },
    {
      label: 'Status da Conta'
    },
    {
      key: 'status-pending',
      label: 'Pendente',
      icon: Clock,
      className: 'text-yellow-600'
    },
    {
      key: 'status-approved',
      label: 'Aprovar',
      icon: CheckCircle,
      className: 'text-green-600'
    },
    {
      key: 'status-rejected',
      label: 'Rejeitar',
      icon: XCircle,
      className: 'text-red-600'
    }
  ]

  // Bulk actions
  const bulkActions = [
    {
      key: 'approve-all',
      label: 'Aprovar Selecionados',
      icon: CheckCircle
    },
    {
      key: 'reject-all',
      label: 'Rejeitar Selecionados',
      icon: XCircle
    }
  ]

  // Action handler
  const handleAction = React.useCallback(async (action: string, braider: BraiderAdmin) => {
    switch (action) {
      case 'view':
        router.push(`/dashboard/braiders/${braider.id}`)
        break
      case 'edit':
        router.push(`/dashboard/braiders/${braider.id}/edit`)
        break
      case 'contact':
        window.location.href = `mailto:${braider.email}`
        break
      case 'status-pending':
        handleStatusChange(braider.id, 'pending')
        break
      case 'status-approved':
        handleStatusChange(braider.id, 'approved')
        break
      case 'status-rejected':
        handleStatusChange(braider.id, 'rejected')
        break
    }
  }, [router])

  // Bulk action handler
  const handleBulkAction = React.useCallback(async (action: string, braiders: BraiderAdmin[]) => {
    const newStatus = action === 'approve-all' ? 'approved' : 'rejected'
    
    const confirmMessage = `Deseja ${action === 'approve-all' ? 'aprovar' : 'rejeitar'} ${braiders.length} trancista(s)?`
    if (!confirm(confirmMessage)) return

    setActionLoading('bulk')
    try {
      const promises = braiders.map(braider => 
        updateBraiderStatusAdmin(braider.id, newStatus)
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} trancista(s) ${action === 'approve-all' ? 'aprovado(s)' : 'rejeitado(s)'} com sucesso`)
      }
      if (failed > 0) {
        toast.error(`${failed} trancista(s) falharam ao atualizar`)
      }
    } catch (error) {
      console.error('Error in bulk action:', error)
      toast.error('Erro na ação em lote')
    } finally {
      setActionLoading(null)
    }
  }, [])

  // Status change function
  const handleStatusChange = async (braiderId: string, newStatus: string) => {
    setActionLoading(braiderId)
    try {
      const { success, error } = await updateBraiderStatusAdmin(braiderId, newStatus)
      if (success) {
        toast.success(`Status atualizado para ${getStatusLabel(newStatus)}`)
      } else {
        toast.error(error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating braider status:', error)
      toast.error('Erro inesperado ao atualizar status')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <DataTable<BraiderAdmin>
      fetchFunction={fetchBraiders}
      columns={columns}
      actions={actions}
      bulkActions={bulkActions}
      title="Trancistas da Plataforma"
      description="Gerencie perfis, aprovações e status dos trancistas"
      icon={UserCheck}
      totalLabel="trancistas"
      searchPlaceholder="Pesquisar por nome, email ou cidade..."
      enableSelection={true}
      emptyIcon={UserCheck}
      emptyTitle="Nenhum trancista encontrado"
      emptyDescription="Os trancistas aparecerão aqui após se cadastrarem"
      onAction={handleAction}
      onBulkAction={handleBulkAction}
      dependencies={[actionLoading]} // Refresh when actions complete
    />
  )
}

// Helper functions
function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'approved': return 'Aprovado'
    case 'pending': return 'Pendente'
    case 'rejected': return 'Rejeitado'
    default: return status
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}