"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Settings,
  Bell
} from 'lucide-react'

interface DiagnosticResult {
  timestamp: string
  tests: {
    notifications_table: {
      exists: boolean
      error: string | null
      count: number
    }
    notification_settings_table: {
      exists: boolean
      error: string | null
      count: number
    }
    insert_capability: {
      success: boolean
      can_insert: boolean
      error: string | null
    }
    columns_check: {
      has_expected_columns: boolean
      error: string | null
    }
    schema_analysis: any
  }
  summary: {
    notifications_table_exists: boolean
    notification_settings_table_exists: boolean
    can_insert_notifications: boolean
    has_proper_schema: boolean
    overall_status: string
  }
}

export const NotificationsDiagnostics = () => {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/check-notifications')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run diagnostics')
      }
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean, warning = false) => {
    if (success) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (warning) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge className="bg-green-100 text-green-800">Funcionando</Badge>
      case 'MISSING_TABLES':
        return <Badge className="bg-red-100 text-red-800">Tabelas em Falta</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Desconhecido</Badge>
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnóstico do Sistema de Notificações
        </CardTitle>
        <CardDescription>
          Verificação das tabelas e funcionalidades do sistema de notificações
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'A verificar...' : 'Executar Diagnóstico'}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erro:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span className="font-medium">Status Geral</span>
              </div>
              {getStatusBadge(result.summary.overall_status)}
            </div>

            {/* Testes Detalhados */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tabela Notifications */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(result.tests.notifications_table.exists)}
                    Tabela 'notifications'
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <div className="space-y-1">
                    <p><strong>Existe:</strong> {result.tests.notifications_table.exists ? 'Sim' : 'Não'}</p>
                    {result.tests.notifications_table.error && (
                      <p className="text-red-600"><strong>Erro:</strong> {result.tests.notifications_table.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabela Notification Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(result.tests.notification_settings_table.exists)}
                    Tabela 'notification_settings'
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <div className="space-y-1">
                    <p><strong>Existe:</strong> {result.tests.notification_settings_table.exists ? 'Sim' : 'Não'}</p>
                    {result.tests.notification_settings_table.error && (
                      <p className="text-red-600"><strong>Erro:</strong> {result.tests.notification_settings_table.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Capacidade de Inserção */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(result.tests.insert_capability.can_insert)}
                    Capacidade de Inserção
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <div className="space-y-1">
                    <p><strong>Pode inserir:</strong> {result.tests.insert_capability.can_insert ? 'Sim' : 'Não'}</p>
                    {result.tests.insert_capability.error && (
                      <p className="text-red-600"><strong>Erro:</strong> {result.tests.insert_capability.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Schema das Colunas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(result.tests.columns_check.has_expected_columns)}
                    Schema das Colunas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <div className="space-y-1">
                    <p><strong>Colunas correctas:</strong> {result.tests.columns_check.has_expected_columns ? 'Sim' : 'Não'}</p>
                    {result.tests.columns_check.error && (
                      <p className="text-red-600"><strong>Erro:</strong> {result.tests.columns_check.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recomendações */}
            {result.summary.overall_status !== 'OK' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Acção Necessária:</strong> As tabelas de notificações não existem ou estão incorrectas. 
                  É necessário executar o script de criação das tabelas no banco de dados.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500">
              Última verificação: {new Date(result.timestamp).toLocaleString('pt-PT')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}