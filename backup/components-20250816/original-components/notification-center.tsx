"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotifications, type Notification } from "@/context/notifications-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ShoppingBag, 
  MessageSquare, 
  Calendar, 
  Settings,
  Trash2,
  Check,
  CheckCheck,
  X,
  Filter,
  MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-600" />
    case 'order':
      return <ShoppingBag className="h-4 w-4 text-purple-600" />
    case 'message':
      return <MessageSquare className="h-4 w-4 text-indigo-600" />
    case 'booking':
      return <Calendar className="h-4 w-4 text-teal-600" />
    case 'system':
      return <Settings className="h-4 w-4 text-gray-600" />
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

const getNotificationBgColor = (type: Notification['type'], isRead: boolean) => {
  if (isRead) return "bg-gray-50"
  
  switch (type) {
    case 'success':
      return "bg-green-50 border-l-4 border-l-green-500"
    case 'error':
      return "bg-red-50 border-l-4 border-l-red-500"
    case 'warning':
      return "bg-yellow-50 border-l-4 border-l-yellow-500"
    case 'info':
      return "bg-blue-50 border-l-4 border-l-blue-500"
    case 'order':
      return "bg-purple-50 border-l-4 border-l-purple-500"
    case 'message':
      return "bg-indigo-50 border-l-4 border-l-indigo-500"
    case 'booking':
      return "bg-teal-50 border-l-4 border-l-teal-500"
    case 'system':
      return "bg-gray-50 border-l-4 border-l-gray-500"
    default:
      return "bg-blue-50 border-l-4 border-l-blue-500"
  }
}

const formatTimestamp = (timestamp: string) => {
  const now = new Date()
  const notificationTime = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return "Agora"
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h atrás`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d atrás`
  
  return notificationTime.toLocaleDateString('pt-PT')
}

interface NotificationItemProps {
  notification: Notification
  onClose?: () => void
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications()
  const router = useRouter()

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(notification.id)
  }

  const NotificationContent = (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer",
        getNotificationBgColor(notification.type, notification.isRead)
      )}
      onClick={handleMarkAsRead}
    >
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={cn(
            "text-sm line-clamp-1",
            notification.isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"
          )}>
            {notification.title}
            {notification.isImportant && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Importante
              </Badge>
            )}
          </h4>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.timestamp)}
            </span>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
        
        <p className={cn(
          "text-sm line-clamp-2 mb-2",
          notification.isRead ? "text-gray-600" : "text-gray-700"
        )}>
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          {notification.actionUrl && notification.actionLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onClose) onClose()
                router.push(notification.actionUrl! as any)
              }}
              className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700 bg-transparent border-none cursor-pointer"
            >
              {notification.actionLabel}
            </button>
          )}
          
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="icon"
            className="w-6 h-6 text-gray-400 hover:text-red-500 ml-auto"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )

  const handleNotificationClick = () => {
    handleMarkAsRead()
    if (notification.actionUrl && !notification.isRead) {
      if (onClose) onClose()
      router.push(notification.actionUrl as any)
    }
  }

  if (notification.actionUrl && !notification.isRead) {
    return (
      <div onClick={handleNotificationClick} className="cursor-pointer">
        {NotificationContent}
      </div>
    )
  }

  return NotificationContent
}

interface NotificationCenterProps {
  onClose?: () => void
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <Card className="w-80 max-h-96 bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-blue-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Filter Toggle */}
            <Button
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              variant="ghost"
              size="icon"
              className="w-8 h-8"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={clearAllNotifications} 
                  disabled={notifications.length === 0}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar todas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="icon" className="w-8 h-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {filter === 'unread' && (
          <p className="text-xs text-gray-600">
            Mostrando apenas não lidas ({filteredNotifications.length})
          </p>
        )}
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </h3>
              <p className="text-sm text-gray-600">
                {filter === 'unread' 
                  ? 'Todas as suas notificações foram lidas' 
                  : 'Você receberá notificações aqui quando houver atividade'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {filteredNotifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}