"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Users, 
  Euro, 
  Eye, 
  MousePointer, 
  MessageCircle, 
  Settings,
  Crown,
  Megaphone,
  Gift,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { toast } from "react-hot-toast"
import { PromotionsRevenueChart } from "@/components/promotions-revenue-chart"

interface PromotionSettings {
  system_enabled: boolean
  payments_enabled: boolean
  free_trial_enabled: boolean
  max_hero_banners: number
  max_highlighted_profiles: number
  auto_approval_profiles: boolean
  hero_requires_approval: boolean
}

interface SystemStats {
  total_promotions: number
  active_promotions: number
  total_revenue: number
  total_views: number
  total_clicks: number
  ctr_percentage: number
  avg_revenue_per_promotion: number
}

interface Promotion {
  id: string
  type: 'profile_highlight' | 'hero_banner' | 'combo_package'
  title: string
  description: string
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'rejected'
  price: number
  views_count: number
  clicks_count: number
  contacts_count: number
  start_date: string
  end_date: string
  created_at: string
  user: {
    id: string
    email: string
    raw_user_meta_data: any
  }
}

export default function PromotionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PromotionSettings | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingSettings, setUpdatingSettings] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    filterPromotions()
  }, [promotions, statusFilter, typeFilter, searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch settings, stats e promotions em paralelo
      const [settingsRes, statsRes, promotionsRes] = await Promise.all([
        fetch('/api/promotions/settings'),
        fetch('/api/admin/promotions/stats'),
        fetch('/api/promotions?limit=100')
      ])

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        const settingsMap = settingsData.settings || {}
        
        setSettings({
          system_enabled: settingsMap.system_enabled?.value === true,
          payments_enabled: settingsMap.payments_enabled?.value === true,
          free_trial_enabled: settingsMap.free_trial_enabled?.value === true,
          max_hero_banners: parseInt(settingsMap.max_hero_banners?.value) || 3,
          max_highlighted_profiles: parseInt(settingsMap.max_highlighted_profiles?.value) || 15,
          auto_approval_profiles: settingsMap.auto_approval_profiles?.value === true,
          hero_requires_approval: settingsMap.hero_requires_approval?.value === true
        })
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      } else {
        // Fallback stats
        setStats({
          total_promotions: 0,
          active_promotions: 0,
          total_revenue: 0,
          total_views: 0,
          total_clicks: 0,
          ctr_percentage: 0,
          avg_revenue_per_promotion: 0
        })
      }

      if (promotionsRes.ok) {
        const promotionsData = await promotionsRes.json()
        setPromotions(promotionsData.promotions || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados do sistema')
    } finally {
      setLoading(false)
    }
  }

  const filterPromotions = () => {
    let filtered = promotions

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPromotions(filtered)
  }

  const updateSetting = async (key: string, value: any) => {
    // Set loading state for this specific setting
    setUpdatingSettings(prev => ({ ...prev, [key]: true }))
    
    try {
      const response = await fetch('/api/promotions/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })

      if (!response.ok) throw new Error('Failed to update setting')
      
      // Update settings locally instead of reloading all data
      setSettings(prevSettings => {
        if (!prevSettings) return prevSettings
        return {
          ...prevSettings,
          [key]: value
        }
      })
      
      toast.success(`Configuração ${key} atualizada!`)
      
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Erro ao atualizar configuração')
    } finally {
      // Remove loading state for this setting
      setUpdatingSettings(prev => ({ ...prev, [key]: false }))
    }
  }

  const handlePromotionAction = async (promotionId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const status = action === 'approve' ? 'active' : 'rejected'
      const updates: any = { status }
      
      if (action === 'reject' && reason) {
        updates.rejection_reason = reason
      }

      const response = await fetch(`/api/promotions/${promotionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update promotion')
      
      toast.success(`Promoção ${action === 'approve' ? 'aprovada' : 'rejeitada'}!`)
      fetchData() // Reload data
      
    } catch (error) {
      console.error('Error updating promotion:', error)
      toast.error('Erro ao atualizar promoção')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Ativa' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Expirada' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelada' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeitada' }
    }

    const variant = variants[status as keyof typeof variants] || variants.pending
    const Icon = variant.icon

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile_highlight': return Crown
      case 'hero_banner': return Megaphone
      case 'combo_package': return Gift
      default: return Star
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de promoções...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Sistema de Promoções
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie promoções, configurações e monitore o desempenho
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
          >
            Atualizar Dados
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Promoções</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_promotions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_promotions} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.total_revenue}</div>
              <p className="text-xs text-muted-foreground">
                €{stats.avg_revenue_per_promotion}/promoção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_clicks.toLocaleString()} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ctr_percentage}%</div>
              <p className="text-xs text-muted-foreground">
                CTR geral do sistema
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="promotions">Promoções</TabsTrigger>
          <TabsTrigger value="revenue">Receitas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Sistema de Promoções</span>
                  <Badge className={settings?.system_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {settings?.system_enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cobrança de Pagamentos</span>
                  <Badge className={settings?.payments_enabled ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                    {settings?.payments_enabled ? 'Ativa' : 'Gratuito'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Teste Gratuito</span>
                  <Badge className={settings?.free_trial_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {settings?.free_trial_enabled ? 'Habilitado' : 'Desabilitado'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => updateSetting('payments_enabled', !settings?.payments_enabled)}
                  variant={settings?.payments_enabled ? "destructive" : "default"}
                  disabled={updatingSettings.payments_enabled}
                >
                  {updatingSettings.payments_enabled ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    settings?.payments_enabled ? 'Desativar Cobrança' : 'Ativar Modo Pago'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => updateSetting('system_enabled', !settings?.system_enabled)}
                  disabled={updatingSettings.system_enabled}
                >
                  {updatingSettings.system_enabled ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    settings?.system_enabled ? 'Desativar Sistema' : 'Ativar Sistema'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={fetchData}
                >
                  Atualizar Dados
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar Promoções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Buscar</Label>
                  <Input
                    placeholder="Título ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="expired">Expiradas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="profile_highlight">Perfil Destaque</SelectItem>
                      <SelectItem value="hero_banner">Banner Hero</SelectItem>
                      <SelectItem value="combo_package">Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setTypeFilter('all')
                  }}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotions List */}
          <Card>
            <CardHeader>
              <CardTitle>Promoções ({filteredPromotions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPromotions.map((promotion) => {
                  const TypeIcon = getTypeIcon(promotion.type)
                  
                  return (
                    <div key={promotion.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <TypeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{promotion.title}</h3>
                            <p className="text-sm text-gray-600">{promotion.user.email}</p>
                            <p className="text-sm text-gray-500">{promotion.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(promotion.status)}
                          <Badge variant="outline">€{promotion.price}</Badge>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {promotion.views_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-4 w-4" />
                          {promotion.clicks_count} clicks
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {promotion.contacts_count} contatos
                        </span>
                      </div>

                      {/* Actions for pending promotions */}
                      {promotion.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => handlePromotionAction(promotion.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromotionAction(promotion.id, 'reject', 'Rejeitada pelo administrador')}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {filteredPromotions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma promoção encontrada com os filtros selecionados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <PromotionsRevenueChart />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Sistema de Promoções</Label>
                      <p className="text-sm text-gray-500">Ativar/desativar todo o sistema</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {updatingSettings.system_enabled && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      )}
                      <Switch
                        checked={settings.system_enabled}
                        onCheckedChange={(checked) => updateSetting('system_enabled', checked)}
                        disabled={updatingSettings.system_enabled}
                        className={updatingSettings.system_enabled ? "opacity-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Cobrança de Pagamentos</Label>
                      <p className="text-sm text-gray-500">Ativar modo pago ou manter gratuito</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {updatingSettings.payments_enabled && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      )}
                      <Switch
                        checked={settings.payments_enabled}
                        onCheckedChange={(checked) => updateSetting('payments_enabled', checked)}
                        disabled={updatingSettings.payments_enabled}
                        className={updatingSettings.payments_enabled ? "opacity-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Teste Gratuito</Label>
                      <p className="text-sm text-gray-500">Permitir período gratuito para novos usuários</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {updatingSettings.free_trial_enabled && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      )}
                      <Switch
                        checked={settings.free_trial_enabled}
                        onCheckedChange={(checked) => updateSetting('free_trial_enabled', checked)}
                        disabled={updatingSettings.free_trial_enabled}
                        className={updatingSettings.free_trial_enabled ? "opacity-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Máximo de Banners Hero</Label>
                      <Input
                        type="number"
                        value={settings.max_hero_banners}
                        onChange={(e) => updateSetting('max_hero_banners', parseInt(e.target.value))}
                        min={1}
                        max={10}
                      />
                    </div>
                    <div>
                      <Label>Máximo de Perfis em Destaque</Label>
                      <Input
                        type="number"
                        value={settings.max_highlighted_profiles}
                        onChange={(e) => updateSetting('max_highlighted_profiles', parseInt(e.target.value))}
                        min={5}
                        max={50}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Aprovação Automática - Perfis</Label>
                      <p className="text-sm text-gray-500">Aprovar perfis destacados automaticamente</p>
                    </div>
                    <Switch
                      checked={settings.auto_approval_profiles}
                      onCheckedChange={(checked) => updateSetting('auto_approval_profiles', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Requer Aprovação - Hero</Label>
                      <p className="text-sm text-gray-500">Banners do hero precisam aprovação manual</p>
                    </div>
                    <Switch
                      checked={settings.hero_requires_approval}
                      onCheckedChange={(checked) => updateSetting('hero_requires_approval', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}