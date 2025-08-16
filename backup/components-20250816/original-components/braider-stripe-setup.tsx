"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Shield
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface StripeAccountStatus {
  braiderId: string
  hasStripeAccount: boolean
  stripeAccountId?: string
  subscriptionStatus: string
  accountStatus?: {
    isActive: boolean
    requiresOnboarding: boolean
    canReceivePayments: boolean
  }
  onboardingRequired: boolean
}

interface BraiderStripeSetupProps {
  braiderId: string
  className?: string
}

export function BraiderStripeSetup({ braiderId, className }: BraiderStripeSetupProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<StripeAccountStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadStripeStatus()
  }, [braiderId])

  const loadStripeStatus = async () => {
    try {
      const response = await fetch('/api/braider/stripe')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error loading Stripe status:', error)
    } finally {
      setLoading(false)
    }
  }

  const createStripeAccount = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/braider/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_account'
        })
      })

      if (response.ok) {
        toast({
          title: "✅ Conta Stripe Criada",
          description: "Sua conta Stripe foi criada com sucesso. Agora complete o processo de configuração."
        })
        await loadStripeStatus()
      } else {
        throw new Error('Failed to create Stripe account')
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao criar conta Stripe. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const startOnboarding = async () => {
    setProcessing(true)
    try {
      const returnUrl = `${window.location.origin}/braider-dashboard?stripe_return=success`
      const refreshUrl = `${window.location.origin}/braider-dashboard?stripe_return=refresh`

      const response = await fetch('/api/braider/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_onboarding_link',
          returnUrl,
          refreshUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.onboardingUrl) {
          // Redirect to Stripe onboarding
          window.location.href = data.onboardingUrl
        }
      } else {
        throw new Error('Failed to create onboarding link')
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao iniciar processo de configuração. Tente novamente.",
        variant: "destructive"
      })
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
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
    )
  }

  if (!status) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar o status da sua conta Stripe.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getStatusInfo = () => {
    if (!status.hasStripeAccount) {
      return {
        status: "not_created",
        title: "Conta Stripe Necessária",
        description: "Para receber pagamentos, você precisa criar uma conta Stripe Connect.",
        color: "blue",
        icon: CreditCard
      }
    }

    if (status.onboardingRequired) {
      return {
        status: "onboarding_required", 
        title: "Complete a Configuração",
        description: "Sua conta Stripe foi criada, mas precisa ser configurada para receber pagamentos.",
        color: "orange",
        icon: Clock
      }
    }

    if (status.accountStatus?.canReceivePayments) {
      return {
        status: "active",
        title: "Conta Ativa",
        description: "Sua conta Stripe está configurada e pode receber pagamentos.",
        color: "green",
        icon: CheckCircle
      }
    }

    return {
      status: "pending",
      title: "Configuração Pendente",
      description: "Sua conta está sendo verificada pelo Stripe.",
      color: "yellow", 
      icon: Clock
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className={cn("border-l-4", {
      "border-l-blue-500": statusInfo.color === "blue",
      "border-l-orange-500": statusInfo.color === "orange", 
      "border-l-green-500": statusInfo.color === "green",
      "border-l-yellow-500": statusInfo.color === "yellow"
    }, className)}>
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <statusInfo.icon className="h-5 w-5" />
            Configuração de Pagamentos
          </CardTitle>
          <Badge 
            variant={statusInfo.color === "green" ? "default" : "secondary"}
            className={cn({
              "bg-blue-100 text-blue-800": statusInfo.color === "blue",
              "bg-orange-100 text-orange-800": statusInfo.color === "orange",
              "bg-green-100 text-green-800": statusInfo.color === "green", 
              "bg-yellow-100 text-yellow-800": statusInfo.color === "yellow"
            })}
          >
            {statusInfo.status === "active" ? "ATIVA" : 
             statusInfo.status === "not_created" ? "NECESSÁRIA" :
             statusInfo.status === "onboarding_required" ? "PENDENTE" : "VERIFICANDO"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        
        <div className={cn("p-4 rounded-lg", {
          "bg-blue-50": statusInfo.color === "blue",
          "bg-orange-50": statusInfo.color === "orange",
          "bg-green-50": statusInfo.color === "green",
          "bg-yellow-50": statusInfo.color === "yellow"
        })}>
          <h4 className="font-semibold text-gray-900 mb-2">{statusInfo.title}</h4>
          <p className="text-sm text-gray-700">{statusInfo.description}</p>
        </div>

        {/* Benefits section */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900">Benefícios da Conta Stripe:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Pagamentos Diretos</p>
                <p className="text-xs text-gray-600">Receba pagamentos diretamente na sua conta</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Segurança Total</p>
                <p className="text-xs text-gray-600">Transações protegidas e certificadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t">
          {statusInfo.status === "not_created" && (
            <Button 
              onClick={createStripeAccount}
              disabled={processing}
              className="w-full"
            >
              {processing ? "Criando..." : "Criar Conta Stripe"}
            </Button>
          )}

          {statusInfo.status === "onboarding_required" && (
            <Button 
              onClick={startOnboarding}
              disabled={processing}
              className="w-full"
            >
              {processing ? "Redirecionando..." : (
                <>
                  Completar Configuração
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {statusInfo.status === "active" && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Configuração Completa!</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Você pode receber pagamentos através da plataforma.
              </p>
            </div>
          )}

          {statusInfo.status === "pending" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Sua conta está sendo verificada pelo Stripe. Este processo pode levar alguns minutos.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Additional info */}
        {status.hasStripeAccount && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>ID da Conta: {status.stripeAccountId}</p>
            <p>Status da Assinatura: {status.subscriptionStatus}</p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}