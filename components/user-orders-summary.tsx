"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Activity, 
  XCircle, 
  Euro,
  Calendar,
  Eye,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { type Order } from "@/lib/data-supabase"
import { cn } from "@/lib/utils"

interface UserOrdersSummaryProps {
  orders: Order[]
  loading: boolean
}

export function UserOrdersSummary({ orders, loading }: UserOrdersSummaryProps) {
  const getOrderStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "processing":
        return <Activity className="h-4 w-4 text-blue-600" />
      case "shipped":
        return <Package className="h-4 w-4 text-purple-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "shipped":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getOrderStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "Entregue"
      case "pending":
        return "Pendente"
      case "processing":
        return "Processando"
      case "shipped":
        return "Enviado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calculate stats
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const completedOrders = orders.filter(order => order.status === 'delivered').length
  const pendingOrders = orders.filter(order => 
    ['pending', 'processing', 'shipped'].includes(order.status)
  ).length

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Carregando pedidos...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Meus Pedidos (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg mb-2">Nenhum pedido encontrado</p>
            <p className="text-gray-400 text-sm mb-6">Você ainda não fez nenhuma compra</p>
            <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
              <Link href="/products">
                <Package className="h-4 w-4 mr-2" />
                Começar a Comprar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Meus Pedidos ({orders.length})
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Euro className="h-3 w-3" />
                Total gasto: €{totalSpent.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {completedOrders} concluídos
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-600" />
                {pendingOrders} em andamento
              </span>
            </div>
          </div>
          <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
            <Link href="/products">
              <Package className="h-4 w-4 mr-2" />
              Nova Compra
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.slice(0, 3).map((order) => (
            <div key={order.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    Pedido #{order.orderNumber}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-purple-600 mb-1">€{order.total.toFixed(2)}</div>
                  <Badge variant="secondary" className={cn("text-xs", getOrderStatusBadgeClass(order.status))}>
                    <span className="flex items-center gap-1">
                      {getOrderStatusIcon(order.status)}
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </Badge>
                </div>
              </div>
              
              {/* Items Preview */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex-shrink-0">
                    <Image
                      src={item.productImage || "/placeholder.svg?height=40&width=40"}
                      alt={item.productName}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                      unoptimized={true}
                    />
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-semibold text-gray-600">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                >
                  <Link href={`/track-order?orderNumber=${order.orderNumber}&email=${order.customerEmail}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Acompanhar
                  </Link>
                </Button>
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`${order.orderNumber}`)
                      alert(`Número do pedido ${order.orderNumber} copiado!`)
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-xl px-3"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {orders.length > 3 && (
            <div className="text-center pt-4">
              <Button variant="outline" className="rounded-xl">
                <Package className="h-4 w-4 mr-2" />
                Ver todos os {orders.length} pedidos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}