"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getUserOrders, type Order } from "@/lib/orders"
import { 
  ArrowLeft, 
  ShoppingCart, 
  Calendar, 
  Package, 
  Euro, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Truck,
  CreditCard,
  FileText,
  Edit3
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      try {
        // Get all orders and find the specific one
        const orders = await getUserOrders("user-1700000000000")
        const foundOrder = orders.find(o => o.id === orderId)
        setOrder(foundOrder || null)
      } catch (error) {
        console.error("Error fetching order:", error)
        setOrder(null)
      }
      setLoading(false)
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "entregue":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "pendente":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "processando":
        return <RefreshCw className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "entregue":
        return "bg-green-100 text-green-700 border-green-200"
      case "pendente":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "processando":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-3xl mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-8">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
            <p className="text-gray-600 mb-6">O pedido com ID "{orderId}" não existe ou foi removido.</p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Pedidos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Pedido #{order.id.split("-")[1]} 📋
                </h1>
                <p className="text-white/90 text-lg">
                  Detalhes completos do pedido
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Realizado em {order.date}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">€{order.total.toFixed(2)}</div>
              <div className="text-white/80 font-medium">Valor Total</div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className={cn("text-sm px-4 py-2", getStatusBadgeClass(order.status))}>
              <span className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                Status: {order.status}
              </span>
            </Badge>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
              <span className="text-sm font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido
              </CardTitle>
              <CardDescription>
                Produtos incluídos neste pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-4">
                    <Image
                      src={item.imageUrl || "/placeholder.svg?height=80&width=80"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                      unoptimized={true}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">{item.name}</h4>
                      <p className="text-gray-600 mt-1">
                        Quantidade: <span className="font-semibold">{item.quantity}</span>
                      </p>
                      <p className="text-gray-600">
                        Preço unitário: <span className="font-semibold">€{item.price.toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        €{(item.quantity * item.price).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">Subtotal</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              {/* Order Total */}
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-xl font-bold text-gray-900">Total do Pedido:</span>
                <span className="text-3xl font-bold text-blue-600">€{order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico do Pedido
              </CardTitle>
              <CardDescription>
                Acompanhe o status e movimentações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline Items */}
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Pedido Criado</p>
                    <p className="text-sm text-gray-600">{order.date} • Pedido realizado pelo cliente</p>
                  </div>
                </div>

                {order.status === "Processando" && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Em Processamento</p>
                      <p className="text-sm text-gray-600">Pedido sendo preparado</p>
                    </div>
                  </div>
                )}

                {order.status === "Entregue" && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Pedido Entregue</p>
                      <p className="text-sm text-gray-600">Pedido concluído com sucesso</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Cliente #{order.id.split("-")[1]}</p>
                  <p className="text-sm text-gray-600">ID do usuário</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">cliente@exemplo.com</p>
                  <p className="text-sm text-gray-600">Email de contato</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">+351 900 000 000</p>
                  <p className="text-sm text-gray-600">Telefone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900">Pagamento Confirmado</span>
                </div>
                <p className="text-sm text-gray-600">Método: Cartão de Crédito</p>
                <p className="text-sm text-gray-600">Total: €{order.total.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Endereço Principal</p>
                  <p className="text-sm text-gray-600">Rua Exemplo, 123</p>
                  <p className="text-sm text-gray-600">1000-000 Lisboa, Portugal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === "Pendente" && (
                <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                  <Link href={`/dashboard/orders/${order.id}/process`}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Processar Pedido
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" className="w-full rounded-xl">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Fatura
              </Button>
              
              <Button variant="outline" className="w-full rounded-xl">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}