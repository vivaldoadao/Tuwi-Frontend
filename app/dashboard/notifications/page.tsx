"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, User, Package, ShoppingCart, AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/role-guard"
import Link from "next/link"
import { toast } from "react-hot-toast"

// Tipo para notificações
interface Notification {
  id: string
  type: 'braider_registration' | 'new_order' | 'low_stock' | 'system_alert'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedId?: string
  relatedUrl?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulação de notificações - em produção seria uma API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'braider_registration',
        title: 'Nova Solicitação de Trancista',
        message: 'Maria Silva enviou uma solicitação para se tornar trancista parceira',
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedId: 'braider-123',
        relatedUrl: '/dashboard/braiders/braider-123'
      },
      {
        id: '2',
        type: 'new_order',
        title: 'Novo Pedido Recebido',
        message: 'Pedido #1234 foi realizado por Ana Costa - Total: €89,90',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        relatedId: 'order-1234',
        relatedUrl: '/dashboard/orders/1234'
      },
      {
        id: '3',
        type: 'low_stock',
        title: 'Estoque Baixo',
        message: 'Produto "Box Braids Premium" está com estoque baixo (apenas 3 unidades)',
        isRead: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
        relatedId: 'product-456',
        relatedUrl: '/dashboard/products/456'
      },
      {
        id: '4',
        type: 'system_alert',
        title: 'Backup Concluído',
        message: 'Backup diário do sistema foi concluído com sucesso',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
      }
    ]
    
    setNotifications(mockNotifications)
    setLoading(false)
  }, [])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'braider_registration':
        return <User className="h-5 w-5 text-purple-600" />
      case 'new_order':
        return <ShoppingCart className="h-5 w-5 text-green-600" />
      case 'low_stock':
        return <Package className="h-5 w-5 text-orange-600" />
      case 'system_alert':
        return <AlertTriangle className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: Notification['type']) => {
    switch (type) {
      case 'braider_registration':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Trancista</Badge>
      case 'new_order':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Pedido</Badge>
      case 'low_stock':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Estoque</Badge>
      case 'system_alert':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Sistema</Badge>
      default:
        return <Badge variant="secondary">Geral</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes} min atrás`
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`
    } else if (diffDays === 1) {
      return 'ontem'
    } else {
      return `${diffDays} dias atrás`
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ))
    toast.success('Notificação marcada como lida')
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })))
    toast.success('Todas as notificações foram marcadas como lidas')
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <AdminGuard redirectTo="/login">
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-3xl mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard redirectTo="/login">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bell className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold font-heading mb-2">
                    Notificações 🔔
                  </h1>
                  <p className="text-white/90 text-lg">
                    Acompanhe todas as atividades importantes da plataforma
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="text-right">
                  <div className="text-3xl font-bold mb-2">{unreadCount}</div>
                  <div className="text-white/80">Não lidas</div>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma notificação</h3>
                <p className="text-gray-600">Não há notificações no momento.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 transition-all hover:shadow-2xl ${
                  !notification.isRead ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getNotificationBadge(notification.type)}
                            {!notification.isRead && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            {formatDate(notification.createdAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            {notification.relatedUrl && (
                              <Link href={notification.relatedUrl as any}>
                                <Button variant="outline" size="sm">
                                  Ver Detalhes
                                </Button>
                              </Link>
                            )}
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminGuard>
  )
}