"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  CreditCard, 
  User, 
  Phone, 
  Mail,
  Edit,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react"
import { getOrderById, getOrderTracking, type Order, type OrderStatus, type TrackingEvent } from "@/lib/data-supabase"
import { formatEuro } from "@/lib/currency"
import { toast } from "react-hot-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import OrderTimeline from "@/components/order-timeline"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200", 
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
}

const statusLabels = {
  pending: "Pendente",
  processing: "Processando",
  shipped: "Enviado", 
  delivered: "Entregue",
  cancelled: "Cancelado"
}

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return

      try {
        setLoading(true)
        const [fetchedOrder, trackingEvents] = await Promise.all([
          getOrderById(orderId),
          getOrderTracking(orderId)
        ])
        setOrder(fetchedOrder)
        setTracking(trackingEvents)
      } catch (error) {
        console.error('Error fetching order:', error)
        toast.error('Erro ao carregar pedido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return

    try {
      setUpdating(true)
      console.log('🔄 Updating order status from', order.status, 'to', newStatus)
      
      // Use the new API route that has admin privileges
      const response = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Reload order data to ensure we have the latest state
        const [updatedOrder, updatedTracking] = await Promise.all([
          getOrderById(order.id),
          getOrderTracking(order.id)
        ])
        
        if (updatedOrder) {
          setOrder(updatedOrder)
          setTracking(updatedTracking)
          console.log('✅ Order data reloaded, new status:', updatedOrder.status)
          toast.success(`Status atualizado para ${statusLabels[newStatus]}`)
        } else {
          console.error('❌ Failed to reload order data')
          toast.error('Status atualizado mas erro ao recarregar dados')
        }
      } else {
        console.error('❌ Failed to update order status:', result.error)
        toast.error(result.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para área de transferência')
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getItemsCount = (items: any[]) => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="w-full h-96 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="w-full h-96 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
        <p className="text-gray-600 mb-6">O pedido solicitado não existe ou foi removido.</p>
        <Button onClick={() => router.push('/dashboard/orders')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Pedidos
        </Button>
      </div>
    )
  }

  const StatusIcon = statusIcons[order.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/orders')}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-600">Detalhes completos do pedido</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`${statusColors[order.status]} border text-base px-3 py-1`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusLabels[order.status]}
          </Badge>
          
          <div className="flex gap-2">
            <Select
              value={order.status}
              onValueChange={handleStatusUpdate}
              disabled={updating}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Button to create initial tracking if none exists */}
            {tracking.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!order) return
                  try {
                    const response = await fetch('/api/create-initial-tracking', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderId: order.id })
                    })
                    const result = await response.json()
                    if (result.success) {
                      toast.success('Histórico inicial criado!')
                      // Reload tracking data
                      const updatedTracking = await getOrderTracking(order.id)
                      setTracking(updatedTracking)
                    } else {
                      toast.error('Erro ao criar histórico')
                    }
                  } catch (error) {
                    console.error('Error creating initial tracking:', error)
                    toast.error('Erro ao criar histórico')
                  }
                }}
                className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                📝 Criar Histórico
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent-600" />
                Items do Pedido ({getItemsCount(order.items)} {getItemsCount(order.items) === 1 ? 'item' : 'itens'})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border">
                  <Image
                    src={item.productImage || "/placeholder.svg"}
                    alt={item.productName}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                    unoptimized={true}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">{item.productName}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>Quantidade: {item.quantity}</span>
                      <span>•</span>
                      <span>Preço unitário: {formatEuro(item.productPrice)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-accent-600">
                      {formatEuro(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatEuro(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete:</span>
                  <span className="font-medium">
                    {order.shippingCost > 0 ? formatEuro(order.shippingCost) : 'Grátis'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-accent-600">{formatEuro(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <OrderTimeline events={tracking} />

          {/* Order Notes */}
          {order.notes && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-accent-600" />
                  Observações do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Customer & Order Details */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent-600" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600">Nome completo</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{order.customerEmail}</p>
                  <p className="text-sm text-gray-600">Email</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{order.customerPhone}</p>
                  <p className="text-sm text-gray-600">Telefone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent-600" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-gray-700">{order.shippingAddress}</p>
                <p className="text-gray-700">
                  {order.shippingCity}, {order.shippingPostalCode}
                </p>
                <p className="text-gray-700">{order.shippingCountry}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-600" />
                Detalhes do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ID do Pedido:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <Button
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(order.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Data do Pedido:</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              
              {order.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Última Atualização:</span>
                  <span className="font-medium">{formatDate(order.updatedAt)}</span>
                </div>
              )}
              
              {order.paymentIntentId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Pagamento Stripe:</span>
                    <Button
                      variant="ghost"
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(order.paymentIntentId!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {order.paymentIntentId}
                  </div>
                </div>
              )}
              
              {order.stripeCustomerId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Cliente Stripe:</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6" 
                      onClick={() => copyToClipboard(order.stripeCustomerId!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {order.stripeCustomerId}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Status:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pago via Stripe
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Total Pago:</span>
                  <span className="font-bold text-xl text-green-800">
                    {formatEuro(order.total)}
                  </span>
                </div>
                {order.paymentIntentId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.paymentIntentId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no Stripe Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}