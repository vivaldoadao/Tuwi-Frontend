"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getUserOrders, type Order } from "@/lib/orders"
import { 
  ArrowLeft, 
  ShoppingCart, 
  Calendar, 
  Package, 
  Euro, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Truck,
  Send,
  FileText,
  Settings,
  Save,
  AlertTriangle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ProcessOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [trackingCode, setTrackingCode] = useState("")

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      try {
        const orders = await getUserOrders("user-1700000000000")
        const foundOrder = orders.find(o => o.id === orderId)
        setOrder(foundOrder || null)
        if (foundOrder) {
          setNewStatus(foundOrder.status)
        }
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

  const handleProcessOrder = async () => {
    if (!order || !newStatus) return

    setProcessing(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would make the actual API call to update the order
    console.log("Processing order:", {
      orderId: order.id,
      newStatus,
      notes,
      trackingCode
    })
    
    setProcessing(false)
    
    // Redirect back to order details
    router.push(`/dashboard/orders/${orderId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "entregue":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "pendente":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "processando":
        return <RefreshCw className="h-5 w-5 text-blue-600" />
      case "cancelado":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
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
      case "cancelado":
        return "bg-red-100 text-red-700 border-red-200"
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
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
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
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Processar Pedido ⚙️
                </h1>
                <p className="text-white/90 text-lg">
                  Altere o status e adicione informações
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Pedido #{order.id.split("-")[1]} • {order.date}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">€{order.total.toFixed(2)}</div>
              <div className="text-white/80 font-medium">Valor Total</div>
            </div>
          </div>
          
          {/* Current Status */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className={cn("text-sm px-4 py-2", getStatusBadgeClass(order.status))}>
              <span className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                Status Atual: {order.status}
              </span>
            </Badge>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
              <span className="text-sm font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - Processing Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Update Form */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Atualizar Status do Pedido
              </CardTitle>
              <CardDescription>
                Altere o status e adicione informações relevantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Selection */}
              <div className="space-y-3">
                <Label htmlFor="status" className="text-base font-semibold text-gray-900">
                  Novo Status
                </Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl">
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="Processando">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        Processando
                      </div>
                    </SelectItem>
                    <SelectItem value="Entregue">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Entregue
                      </div>
                    </SelectItem>
                    <SelectItem value="Cancelado">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Cancelado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Code (only for Processando/Entregue) */}
              {(newStatus === "Processando" || newStatus === "Entregue") && (
                <div className="space-y-3">
                  <Label htmlFor="tracking" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Código de Rastreamento
                  </Label>
                  <input
                    id="tracking"
                    type="text"
                    placeholder="Ex: BR123456789PT"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações Internas
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre o processamento do pedido..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="bg-white border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleProcessOrder}
                  disabled={!newStatus || processing}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12 rounded-xl shadow-lg font-semibold"
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Atualizar Pedido
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-8 h-12 rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Notification */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Comunicação com Cliente
              </CardTitle>
              <CardDescription>
                Configure as notificações que serão enviadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center">
                  <Send className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-semibold text-gray-900">Email Automático</p>
                  <p className="text-sm text-gray-600">Será enviado automaticamente</p>
                </div>
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-semibold text-gray-900">SMS de Acompanhamento</p>
                  <p className="text-sm text-gray-600">Opcional</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Image
                      src={item.imageUrl || "/placeholder.svg?height=40&width=40"}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                      unoptimized={true}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.quantity}x • €{item.price.toFixed(2)}</p>
                    </div>
                    <p className="font-bold text-sm text-gray-900">
                      €{(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-orange-600">€{order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="font-semibold text-gray-900">Cliente #{order.id.split("-")[1]}</p>
                <p className="text-sm text-gray-600">cliente@exemplo.com</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href={`/dashboard/orders/${orderId}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Detalhes Completos
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full rounded-xl">
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}