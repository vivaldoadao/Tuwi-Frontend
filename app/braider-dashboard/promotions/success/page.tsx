"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  CreditCard,
  Calendar,
  Euro,
  AlertTriangle
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import Link from "next/link"

interface SessionStatus {
  id: string
  status: string
  payment_status: string
  amount_total: number
  metadata: {
    promotion_type: string
    user_id: string
    promotion_data: string
  }
}

export default function PromotionSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('ID da sessão não encontrado')
      setLoading(false)
      return
    }

    fetchSessionStatus()
  }, [sessionId])

  const fetchSessionStatus = async () => {
    try {
      const response = await fetch(`/api/promotions/checkout?session_id=${sessionId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao verificar status do pagamento')
      }

      const data = await response.json()
      setSession(data.session)

      if (data.session.payment_status === 'paid') {
        toast.success('Pagamento confirmado! Sua promoção foi criada.')
      }

    } catch (error) {
      console.error('Error fetching session status:', error)
      setError(error instanceof Error ? error.message : 'Erro ao verificar pagamento')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'braider') {
    return (
      <div className="text-center py-8">
        <p>Esta página é apenas para trancistas registradas.</p>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Erro na Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Não foi possível encontrar os detalhes do seu pagamento.</p>
            <Button asChild>
              <Link href="/braider-dashboard/promotions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Promoções
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status do pagamento...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Erro na Verificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{error || 'Não foi possível verificar o status do pagamento.'}</p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/braider-dashboard/promotions">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar às Promoções
                </Link>
              </Button>
              <Button variant="outline" onClick={fetchSessionStatus}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaymentSuccess = session.payment_status === 'paid'
  const promotionData = JSON.parse(session.metadata.promotion_data || '{}')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header com Status */}
      <Card className={`border-2 ${isPaymentSuccess ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-3 text-xl ${isPaymentSuccess ? 'text-green-800' : 'text-yellow-800'}`}>
            {isPaymentSuccess ? (
              <>
                <CheckCircle className="h-8 w-8" />
                Pagamento Confirmado!
              </>
            ) : (
              <>
                <Clock className="h-8 w-8" />
                Processando Pagamento...
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status do Pagamento:</span>
              <Badge className={isPaymentSuccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {isPaymentSuccess ? 'Pago' : 'Processando'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Status da Sessão:</span>
              <Badge variant="outline">
                {session.status === 'complete' ? 'Completa' : session.status}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Valor Total:</span>
              <span className="font-bold text-lg flex items-center gap-1">
                <Euro className="h-4 w-4" />
                {(session.amount_total / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Promoção */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Sua Promoção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{promotionData.title}</h3>
            <p className="text-gray-600">{promotionData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Tipo:</span>
              <p className="font-medium">
                {promotionData.type === 'profile_highlight' && 'Perfil em Destaque'}
                {promotionData.type === 'hero_banner' && 'Banner Hero'}
                {promotionData.type === 'combo' && 'Pacote Combo'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Duração:</span>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(promotionData.start_date).toLocaleDateString()} - {new Date(promotionData.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Próximos Passos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sua promoção foi criada e está aguardando aprovação</li>
              <li>• Nossa equipe revisará o conteúdo em até 24 horas</li>
              <li>• Você receberá uma notificação quando for aprovada</li>
              <li>• A promoção ficará ativa pelo período contratado</li>
            </ul>
          </div>

          {isPaymentSuccess && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Pagamento Processado</h4>
              </div>
              <p className="text-sm text-green-800">
                Seu pagamento foi processado com sucesso. Você pode acompanhar o status da sua promoção na área de promoções.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/braider-dashboard/promotions">
            Ver Minhas Promoções
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/braider-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <strong>ID da Sessão:</strong> {session.id}
            </p>
            <p className="text-xs text-gray-500">
              Guarde este ID para referência futura. Em caso de dúvidas, entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}