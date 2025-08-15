'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StarDisplay } from '@/components/ratings/star-rating'
import { useToast } from '@/hooks/use-toast'
import { 
  Flag,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  User,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

interface Rating {
  id: string
  overall_rating: number
  review_title?: string
  review_text?: string
  client_name: string
  client_email: string
  status: 'active' | 'hidden' | 'flagged' | 'deleted'
  flagged_reason?: string
  created_at: string
  braiders: {
    id: string
    name: string
  }
}

interface Report {
  id: string
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  admin_notes?: string
  created_at: string
  ratings: Rating
  reporter: {
    id: string
    name: string
    email: string
  } | null
  reviewer: {
    id: string
    name: string
    email: string
  } | null
  reviewed_at?: string
}

export default function RatingsModerationPage() {
  const { toast } = useToast()

  const [reports, setReports] = useState<Report[]>([])
  const [flaggedRatings, setFlaggedRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'flagged'>('reports')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'hide' | 'delete'>('approve')
  const [adminNotes, setAdminNotes] = useState('')

  // Load data
  useEffect(() => {
    loadReports()
    loadFlaggedRatings()
  }, [statusFilter])

  const loadReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/ratings/reports?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar reports')
      }

      setReports(data.reports)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast({
        title: "Erro ao carregar reports",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFlaggedRatings = async () => {
    try {
      // In a real implementation, you'd have an endpoint for flagged ratings
      // For now, we'll use the general ratings API with filters
      const response = await fetch('/api/ratings?status=flagged&limit=50')
      const data = await response.json()

      if (response.ok && data.ratings) {
        setFlaggedRatings(data.ratings.filter((r: Rating) => r.status === 'flagged'))
      }
    } catch (error) {
      console.error('Error loading flagged ratings:', error)
    }
  }

  const handleReportAction = async (reportId: string, status: string, ratingAction?: string) => {
    try {
      const response = await fetch(`/api/ratings/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes,
          ratingAction
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar report')
      }

      toast({
        title: "Report processado",
        description: "Ação executada com sucesso"
      })

      // Refresh data
      await loadReports()
      await loadFlaggedRatings()
      
      setSelectedReport(null)
      setShowActionDialog(false)
      setAdminNotes('')

    } catch (error) {
      console.error('Error processing report:', error)
      toast({
        title: "Erro ao processar report",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const handleRatingAction = async (ratingId: string, action: 'hide' | 'delete' | 'restore') => {
    try {
      let newStatus = 'active'
      let flaggedReason = ''

      switch (action) {
        case 'hide':
          newStatus = 'hidden'
          flaggedReason = 'Oculta por moderação'
          break
        case 'delete':
          newStatus = 'deleted' 
          flaggedReason = 'Removida por moderação'
          break
        case 'restore':
          newStatus = 'active'
          flaggedReason = ''
          break
      }

      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          flaggedReason: flaggedReason || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar avaliação')
      }

      toast({
        title: "Avaliação atualizada",
        description: "Status alterado com sucesso"
      })

      await loadFlaggedRatings()

    } catch (error) {
      console.error('Error updating rating:', error)
      toast({
        title: "Erro ao atualizar avaliação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const filteredReports = reports.filter(report => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        report.ratings.review_title?.toLowerCase().includes(searchLower) ||
        report.ratings.review_text?.toLowerCase().includes(searchLower) ||
        report.ratings.client_name.toLowerCase().includes(searchLower) ||
        report.ratings.braiders.name.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'reviewed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />Revisado</Badge>
      case 'dismissed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>
      case 'action_taken':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ação Tomada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRatingStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>
      case 'hidden':
        return <Badge className="bg-yellow-100 text-yellow-800">Oculta</Badge>
      case 'flagged':
        return <Badge className="bg-red-100 text-red-800">Sinalizada</Badge>
      case 'deleted':
        return <Badge className="bg-gray-100 text-gray-800">Removida</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels = {
      inappropriate_content: 'Conteúdo Inadequado',
      fake_review: 'Avaliação Falsa',
      spam: 'Spam',
      harassment: 'Assédio',
      off_topic: 'Fora do Tópico',
      other: 'Outro'
    }
    return labels[reason as keyof typeof labels] || reason
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moderação de Avaliações</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">Reports Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{flaggedRatings.length}</div>
            <div className="text-sm text-gray-600">Avaliações Sinalizadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'action_taken').length}</div>
            <div className="text-sm text-gray-600">Ações Tomadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="reviewed">Revisados</SelectItem>
                <SelectItem value="dismissed">Rejeitados</SelectItem>
                <SelectItem value="action_taken">Ação Tomada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-4 px-2 font-medium ${
            activeTab === 'reports'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Reports ({reports.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`pb-4 px-2 font-medium ${
            activeTab === 'flagged'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Sinalizadas ({flaggedRatings.length})
          </div>
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-32 h-6" />
                      <Skeleton className="w-24 h-6" />
                    </div>
                    <Skeleton className="w-full h-20" />
                    <div className="flex gap-2">
                      <Skeleton className="w-24 h-8" />
                      <Skeleton className="w-24 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Report #{report.id.slice(-8)}
                    </CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Reportado {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                    {report.reporter && (
                      <> por {report.reporter.name}</>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rating Preview */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Avaliação Reportada</h4>
                      {getRatingStatusBadge(report.ratings.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={report.ratings.overall_rating} size="sm" />
                        <span className="text-sm font-medium">{report.ratings.client_name}</span>
                        <span className="text-xs text-gray-500">→ {report.ratings.braiders.name}</span>
                      </div>
                      {report.ratings.review_title && (
                        <h5 className="font-medium text-sm">{report.ratings.review_title}</h5>
                      )}
                      {report.ratings.review_text && (
                        <p className="text-sm text-gray-700 line-clamp-3">{report.ratings.review_text}</p>
                      )}
                    </div>
                  </div>

                  {/* Report Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-sm">Motivo: {getReasonLabel(report.reason)}</span>
                    </div>
                    {report.description && (
                      <p className="text-sm text-gray-700 pl-6">{report.description}</p>
                    )}
                  </div>

                  {/* Admin Notes */}
                  {report.admin_notes && (
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-1">Notas do Admin</div>
                      <div className="text-sm text-blue-800">{report.admin_notes}</div>
                      {report.reviewer && report.reviewed_at && (
                        <div className="text-xs text-blue-600 mt-1">
                          Por {report.reviewer.name} • {formatDistanceToNow(new Date(report.reviewed_at), { addSuffix: true, locale: ptBR })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReportAction(report.id, 'dismissed')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report)
                          setActionType('hide')
                          setShowActionDialog(true)
                        }}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Ocultar Avaliação
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report)
                          setActionType('delete')
                          setShowActionDialog(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover Avaliação
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum report encontrado
                </h3>
                <p className="text-gray-600">
                  {statusFilter !== 'all' ? 'Nenhum report com esse status' : 'Ainda não há reports para revisar'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Flagged Ratings Tab */}
      {activeTab === 'flagged' && (
        <div className="space-y-4">
          {flaggedRatings.length > 0 ? (
            flaggedRatings.map((rating) => (
              <Card key={rating.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Avaliação Sinalizada
                    </CardTitle>
                    {getRatingStatusBadge(rating.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={rating.overall_rating} size="sm" />
                      <span className="text-sm font-medium">{rating.client_name}</span>
                      <span className="text-xs text-gray-500">→ {rating.braiders.name}</span>
                    </div>
                    {rating.review_title && (
                      <h5 className="font-medium">{rating.review_title}</h5>
                    )}
                    {rating.review_text && (
                      <p className="text-gray-700">{rating.review_text}</p>
                    )}
                    {rating.flagged_reason && (
                      <div className="p-2 bg-red-50 rounded border-l-4 border-red-200">
                        <span className="text-sm text-red-800">{rating.flagged_reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRatingAction(rating.id, 'restore')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Restaurar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRatingAction(rating.id, 'hide')}
                      disabled={rating.status === 'hidden'}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ocultar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRatingAction(rating.id, 'delete')}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma avaliação sinalizada
                </h3>
                <p className="text-gray-600">
                  Todas as avaliações estão em conformidade
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' ? 'Remover Avaliação' : 'Ocultar Avaliação'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá {actionType === 'delete' ? 'remover permanentemente' : 'ocultar'} a avaliação e marcar o report como "Ação Tomada".
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Notas do Admin</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Descreva o motivo da ação..."
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedReport) {
                  handleReportAction(
                    selectedReport.id, 
                    'action_taken', 
                    actionType
                  )
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionType === 'delete' ? 'Remover' : 'Ocultar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}