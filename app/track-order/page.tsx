"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SiteLayout } from "@/components/layouts/site-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Package, 
  MapPin, 
  User, 
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  Truck,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Calendar,
  CreditCard
} from "lucide-react"
import { type Order, type TrackingEvent } from "@/lib/data-supabase"
import { formatEuro } from "@/lib/currency"
import { toast } from "react-hot-toast"
import Image from "next/image"
import OrderTimeline from "@/components/order-timeline"

const statusConfig = {
  pending: {
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    icon: Clock,
    label: "Pendente"
  },
  processing: {
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    icon: Package,
    label: "Processando"
  },
  shipped: {
    color: "bg-brand-background",
    bgColor: "bg-brand-50",
    textColor: "text-brand-700",
    borderColor: "border-brand-200",
    icon: Truck,
    label: "Enviado"
  },
  delivered: {
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    icon: CheckCircle,
    label: "Entregue"
  },
  cancelled: {
    color: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    icon: AlertCircle,
    label: "Cancelado"
  }
}

export default function TrackOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<TrackingEvent[]>([])
  const [formData, setFormData] = useState({
    orderNumber: "",
    customerEmail: ""
  })

  // Check URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const orderNumber = urlParams.get('orderNumber')
    const email = urlParams.get('email')
    
    if (orderNumber && email) {
      setFormData({
        orderNumber: orderNumber,
        customerEmail: email
      })
      // Auto-track if both parameters are present
      trackOrderWithParams(orderNumber, email)
    }
  }, [])

  const trackOrderWithParams = async (orderNumber: string, email: string) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          customerEmail: email.trim().toLowerCase()
        }),
      })

      const result = await response.json()
      
      if (result.success && result.order) {
        setOrder(result.order)
        setTracking(result.tracking)
        toast.success('Pedido encontrado com sucesso! 🎉')
      } else {
        toast.error(result.error || 'Pedido não encontrado ou email não confere')
        setOrder(null)
        setTracking([])
      }
    } catch (error) {
      console.error('Error tracking order:', error)
      toast.error('Erro ao buscar pedido')
      setOrder(null)
      setTracking([])
    } finally {
      setLoading(false)
    }
  }

  const handleTrackOrder = async () => {
    if (!formData.orderNumber.trim() || !formData.customerEmail.trim()) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    await trackOrderWithParams(formData.orderNumber, formData.customerEmail)
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado! 📋`)
  }

  const statusInfo = order ? statusConfig[order.status as keyof typeof statusConfig] : null
  const StatusIcon = statusInfo?.icon || Package

  return (
    <SiteLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-background rounded-full mb-6 shadow-lg">
              <Search className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-primary to-brand-background bg-clip-text text-transparent mb-4">
              Rastreamento de Pedido
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Acompanhe seu pedido em tempo real
            </p>
            <p className="text-gray-500">
              Digite o número do seu pedido e email para ver o status da entrega
            </p>
          </div>

          {/* Search Form */}
          <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-primary to-brand-background p-1">
              <div className="bg-white rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-brand-100 rounded-xl">
                      <Search className="h-6 w-6 text-brand-primary" />
                    </div>
                    Buscar Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="orderNumber" className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Número do Pedido
                      </Label>
                      <Input
                        id="orderNumber"
                        placeholder="Ex: 6F0EBBD4"
                        value={formData.orderNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                        className="h-12 text-lg rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        maxLength={9}
                      />
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Use o número de 8 caracteres (sem o #)
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="customerEmail" className="text-base font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email do Cliente
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        className="h-12 text-lg rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                      />
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Email usado no pedido
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={handleTrackOrder}
                      disabled={loading}
                      className="flex-1 h-14 text-lg bg-gradient-to-r from-brand-primary to-brand-background hover:from-brand-800 hover:to-brand-700 rounded-xl shadow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 mr-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-3" />
                          Rastrear Pedido
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="px-6 h-14 rounded-xl border-gray-300 hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Order Results */}
          {order && (
            <div className="space-y-8">
              
              {/* Order Header */}
              <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0 overflow-hidden">
                <div className={`${statusInfo?.color} p-1`}>
                  <div className="bg-white rounded-3xl">
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 ${statusInfo?.bgColor} rounded-2xl flex items-center justify-center`}>
                            <StatusIcon className={`h-8 w-8 ${statusInfo?.textColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-3xl font-bold text-gray-900">
                                Pedido #{order.orderNumber}
                              </h2>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(order.orderNumber, 'Número do pedido')}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <Copy className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                            <p className="text-gray-600 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Pedido realizado em {formatDate(order.createdAt)}
                            </p>
                            <p className="text-gray-600 flex items-center gap-2 mt-1">
                              <Package className="h-4 w-4" />
                              {getItemsCount(order.items)} {getItemsCount(order.items) === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-center lg:text-right">
                          <Badge className={`${statusInfo?.bgColor} ${statusInfo?.textColor} ${statusInfo?.borderColor} border text-lg px-6 py-3 rounded-xl font-semibold mb-3`}>
                            <StatusIcon className="h-5 w-5 mr-2" />
                            {statusInfo?.label}
                          </Badge>
                          <div className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-background bg-clip-text text-transparent">
                            {formatEuro(order.total)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Customer Info */}
                      <div className="grid gap-6 md:grid-cols-3 mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-100 rounded-lg">
                            <User className="h-5 w-5 text-brand-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{order.customerName}</p>
                            <p className="text-sm text-gray-500">Cliente</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Mail className="h-5 w-5 text-brand-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{order.customerEmail}</p>
                            <p className="text-sm text-gray-500">Email</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-brand-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{order.shippingCity}</p>
                            <p className="text-sm text-gray-500">Cidade</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>

              <div className="grid gap-8 lg:grid-cols-2">
                
                {/* Timeline */}
                <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-brand-100 rounded-xl">
                        <Clock className="h-6 w-6 text-brand-primary" />
                      </div>
                      Histórico do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderTimeline events={tracking} />
                  </CardContent>
                </Card>

                {/* Order Details */}
                <div className="space-y-6">
                  
                  {/* Items */}
                  <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <Package className="h-6 w-6 text-brand-primary" />
                        </div>
                        Itens do Pedido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                          <Image
                            src={item.productImage || "/placeholder.svg?height=60&width=60"}
                            alt={item.productName}
                            width={60}
                            height={60}
                            className="rounded-xl object-cover"
                            unoptimized={true}
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.productName}</p>
                            <p className="text-gray-600">
                              {item.quantity}x • {formatEuro(item.productPrice)} cada
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-brand-primary">{formatEuro(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Shipping Address */}
                  <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <MapPin className="h-6 w-6 text-purple-600" />
                        </div>
                        Endereço de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                        <p className="text-gray-700">{order.shippingAddress}</p>
                        <p className="text-gray-700">{order.shippingPostalCode} {order.shippingCity}</p>
                        <p className="text-gray-700">{order.shippingCountry}</p>
                        {order.customerPhone && (
                          <p className="text-gray-600 flex items-center gap-2 mt-2">
                            <Phone className="h-4 w-4" />
                            {order.customerPhone}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Summary */}
                  <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <CreditCard className="h-6 w-6 text-brand-primary" />
                        </div>
                        Resumo do Pedido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold">{formatEuro(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frete</span>
                          <span className="font-semibold">{formatEuro(order.shippingCost)}</span>
                        </div>
                        <hr className="border-gray-200" />
                        <div className="flex justify-between">
                          <span className="text-xl font-bold">Total</span>
                          <span className="text-xl font-bold text-brand-primary">{formatEuro(order.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* No Order Found State */}
          {!order && !loading && formData.orderNumber && formData.customerEmail && (
            <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border-0">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h3>
                <p className="text-gray-600 mb-8">
                  Verifique se o número do pedido e email estão corretos
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setFormData({ orderNumber: "", customerEmail: "" })
                      setOrder(null)
                      setTracking([])
                    }}
                    variant="outline"
                    className="rounded-xl"
                  >
                    Tentar Novamente
                  </Button>
                  <Button
                    onClick={() => router.push('/profile')}
                    className="bg-gradient-to-r from-brand-primary to-brand-background hover:from-brand-800 hover:to-brand-700 rounded-xl"
                  >
                    Ver Meus Pedidos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}