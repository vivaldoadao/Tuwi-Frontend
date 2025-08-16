"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Settings,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Euro,
  Calendar
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface MonetizationSettings {
  monetizationEnabled: boolean
  commissionRate: number
  subscriptionPriceEur: number
  freeBookingsLimit: number
  gracePeriodDays: number
  enableTransactionProcessing: boolean
}

interface MonetizationStats {
  totalBraiders: number
  activeBraiders: number
  totalRevenue: number
  totalCommissions: number
  transactionsThisMonth: number
}

export function AdminMonetizationControls() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<MonetizationSettings>({
    monetizationEnabled: false,
    commissionRate: 0.10,
    subscriptionPriceEur: 10.00,
    freeBookingsLimit: 5,
    gracePeriodDays: 30,
    enableTransactionProcessing: false
  })
  
  const [stats, setStats] = useState<MonetizationStats>({
    totalBraiders: 0,
    activeBraiders: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    transactionsThisMonth: 0
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/monetization')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            monetizationEnabled: data.monetizationEnabled,
            commissionRate: data.commissionRate,
            subscriptionPriceEur: data.subscriptionPriceEur,
            freeBookingsLimit: data.freeBookingsLimit,
            gracePeriodDays: data.gracePeriodDays,
            enableTransactionProcessing: false // Will be loaded separately
          })
        }
      } catch (error) {
        console.error('Error loading monetization settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleEnableMonetization = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/monetization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          commissionRate: settings.commissionRate,
          gracePeriodDays: settings.gracePeriodDays,
          enableTransactionProcessing: settings.enableTransactionProcessing
        })
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, monetizationEnabled: true }))
        toast({
          title: "✅ Monetização Ativada",
          description: `Sistema de cobrança ativado com ${settings.gracePeriodDays} dias de período de transição.`
        })
      } else {
        throw new Error('Failed to enable monetization')
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao ativar a monetização. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDisableMonetization = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/monetization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable'
        })
      })

      if (response.ok) {
        setSettings(prev => ({ 
          ...prev, 
          monetizationEnabled: false,
          enableTransactionProcessing: false 
        }))
        toast({
          title: "✅ Monetização Desativada",
          description: "Sistema retornou ao modo gratuito."
        })
      } else {
        throw new Error('Failed to disable monetization')
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao desativar a monetização. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/monetization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          monetizationEnabled: settings.monetizationEnabled,
          commissionRate: settings.commissionRate,
          subscriptionPriceEur: settings.subscriptionPriceEur,
          gracePeriodDays: settings.gracePeriodDays
        })
      })

      if (response.ok) {
        toast({
          title: "✅ Configurações Atualizadas",
          description: "As configurações foram salvas com sucesso."
        })
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar configurações. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Status Overview */}
      <Card className={cn(
        "border-l-4",
        settings.monetizationEnabled ? "border-l-green-500" : "border-l-blue-500"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sistema de Monetização
            </CardTitle>
            <Badge 
              variant={settings.monetizationEnabled ? "default" : "secondary"}
              className={cn(
                settings.monetizationEnabled 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
              )}
            >
              {settings.monetizationEnabled ? "ATIVO" : "INATIVO"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {!settings.monetizationEnabled ? (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Sistema em Modo Gratuito</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    A plataforma está coletando métricas mas não está cobrando comissões. 
                    Ative a monetização quando estiver pronto.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Taxa de comissão (quando ativo):</span>
                      <span className="font-semibold">{(settings.commissionRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Período de transição:</span>
                      <span className="font-semibold">{settings.gracePeriodDays} dias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Sistema de Cobrança Ativo</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    A plataforma está cobrando {(settings.commissionRate * 100).toFixed(1)}% de comissão 
                    sobre os serviços concluídos.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Processamento real:</span>
                      <span className={cn(
                        "ml-2 font-semibold",
                        settings.enableTransactionProcessing ? "text-green-600" : "text-orange-600"
                      )}>
                        {settings.enableTransactionProcessing ? "Ativo" : "Simulado"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Período de graça:</span>
                      <span className="ml-2 font-semibold">{settings.gracePeriodDays} dias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trancistas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBraiders}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">€{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comissões</p>
                <p className="text-2xl font-bold text-purple-600">€{stats.totalCommissions.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transações/Mês</p>
                <p className="text-2xl font-bold text-orange-600">{stats.transactionsThisMonth}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Monetização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Taxa de Comissão (%)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={settings.commissionRate * 100}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  commissionRate: parseFloat(e.target.value) / 100
                }))}
                className="max-w-[120px]"
              />
              <span className="text-sm text-gray-600">
                Exemplo: 10% = €5.00 comissão em serviço de €50.00
              </span>
            </div>
          </div>

          {/* Grace Period */}
          <div className="space-y-2">
            <Label htmlFor="gracePeriod">Período de Transição (dias)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="gracePeriod"
                type="number"
                min="1"
                max="90"
                value={settings.gracePeriodDays}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  gracePeriodDays: parseInt(e.target.value)
                }))}
                className="max-w-[120px]"
              />
              <span className="text-sm text-gray-600">
                Tempo de aviso antes do início das cobranças
              </span>
            </div>
          </div>

          {/* Transaction Processing */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Processamento Real de Transações</Label>
              <p className="text-sm text-gray-600">
                Quando desabilitado, as transações são apenas simuladas para coleta de métricas
              </p>
            </div>
            <Switch
              checked={settings.enableTransactionProcessing}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                enableTransactionProcessing: checked
              }))}
              disabled={!settings.monetizationEnabled}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            {!settings.monetizationEnabled ? (
              <Button 
                onClick={handleEnableMonetization}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Ativando..." : "Ativar Monetização"}
              </Button>
            ) : (
              <Button 
                onClick={handleDisableMonetization}
                disabled={saving}
                variant="destructive"
              >
                {saving ? "Desativando..." : "Desativar Monetização"}
              </Button>
            )}

            <Button 
              onClick={handleUpdateSettings}
              disabled={saving}
              variant="outline"
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>

          {/* Warning */}
          {settings.monetizationEnabled && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Atenção</p>
                <p className="text-sm text-gray-700">
                  Alterações nas configurações afetam apenas novos agendamentos. 
                  Agendamentos em andamento mantêm as condições originais.
                </p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  )
}