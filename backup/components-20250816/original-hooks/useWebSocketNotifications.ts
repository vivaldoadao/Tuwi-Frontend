"use client"

import { useEffect, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
import type { Notification } from '@/context/notifications-context'

// Tipos específicos para notificações via socket
interface SocketNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'message' | 'booking' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  isImportant: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

interface UseWebSocketNotificationsReturn {
  // Estado da conexão (herdado do hook base)
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  
  // Callbacks para notificações
  onNewNotification: (callback: (notification: SocketNotification) => void) => () => void
  onNotificationRead: (callback: (data: { notificationId: string, isRead: boolean }) => void) => () => void
  onNotificationDeleted: (callback: (data: { notificationId: string }) => void) => () => void
  
  // Actions para notificações
  joinNotifications: () => void
  markNotificationAsRead: (notificationId: string, isRead: boolean) => void
}

export const useWebSocketNotifications = (): UseWebSocketNotificationsReturn => {
  const {
    isConnected,
    isConnecting,
    error,
    onNewMessage,
    onMessageSent,
    onUserTyping,
    onMessageRead,
    onUserJoined,
    onUserLeft
  } = useWebSocket()

  // Referência interna para o socket (será obtida do useWebSocket)
  const socketRef = (useWebSocket as any).socketRef

  // Join notifications room - similar ao join conversation
  const joinNotifications = useCallback(() => {
    if (!isConnected || !socketRef?.current) {
      console.warn('⚠️ Cannot join notifications: not connected')
      return
    }

    console.log('🔔 Joining notifications room')
    socketRef.current.emit('join-notifications')
  }, [isConnected])

  // Marcar notificação como lida via socket
  const markNotificationAsRead = useCallback((notificationId: string, isRead: boolean) => {
    if (!isConnected || !socketRef?.current) {
      console.warn('⚠️ Cannot mark notification as read: not connected')
      return
    }

    console.log(`📋 Marking notification as ${isRead ? 'read' : 'unread'}: ${notificationId}`)
    socketRef.current.emit('mark-notification-read', {
      notificationId,
      isRead
    })
  }, [isConnected])

  // Sistema de callbacks similar ao useWebSocket mas para notificações
  const eventCallbacks = {
    'new-notification': [] as Function[],
    'notification-read': [] as Function[],
    'notification-deleted': [] as Function[]
  }

  const registerNotificationCallback = useCallback((eventName: string, callback: Function) => {
    if (eventCallbacks[eventName as keyof typeof eventCallbacks]) {
      eventCallbacks[eventName as keyof typeof eventCallbacks].push(callback)
    }
    
    // Retornar função de cleanup
    return () => {
      const callbacks = eventCallbacks[eventName as keyof typeof eventCallbacks]
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }, [])

  const triggerNotificationCallback = useCallback((eventName: string, data: any) => {
    const callbacks = eventCallbacks[eventName as keyof typeof eventCallbacks] || []
    callbacks.forEach(callback => callback(data))
  }, [])

  // Event handlers para notificações
  const onNewNotification = useCallback((callback: (notification: SocketNotification) => void) => {
    return registerNotificationCallback('new-notification', callback)
  }, [registerNotificationCallback])

  const onNotificationRead = useCallback((callback: (data: { notificationId: string, isRead: boolean }) => void) => {
    return registerNotificationCallback('notification-read', callback)
  }, [registerNotificationCallback])

  const onNotificationDeleted = useCallback((callback: (data: { notificationId: string }) => void) => {
    return registerNotificationCallback('notification-deleted', callback)
  }, [registerNotificationCallback])

  // Configurar listeners de notificações quando conectado
  useEffect(() => {
    if (!isConnected || !socketRef?.current) return

    const socket = socketRef.current

    // Listener para novas notificações
    const handleNewNotification = (notification: SocketNotification) => {
      console.log('🔔 New notification received via socket:', notification)
      triggerNotificationCallback('new-notification', notification)
    }

    // Listener para notificação marcada como lida
    const handleNotificationRead = (data: { notificationId: string, isRead: boolean, readBy: string }) => {
      console.log('📋 Notification read status changed:', data)
      triggerNotificationCallback('notification-read', data)
    }

    // Listener para notificação deletada
    const handleNotificationDeleted = (data: { notificationId: string, deletedBy: string }) => {
      console.log('🗑️ Notification deleted:', data)
      triggerNotificationCallback('notification-deleted', data)
    }

    // Registrar os listeners
    socket.on('new-notification', handleNewNotification)
    socket.on('notification-read', handleNotificationRead)
    socket.on('notification-deleted', handleNotificationDeleted)

    // Join notifications room automaticamente
    joinNotifications()

    // Cleanup
    return () => {
      socket.off('new-notification', handleNewNotification)
      socket.off('notification-read', handleNotificationRead)
      socket.off('notification-deleted', handleNotificationDeleted)
    }
  }, [isConnected, joinNotifications, triggerNotificationCallback])

  return {
    isConnected,
    isConnecting,
    error,
    onNewNotification,
    onNotificationRead,
    onNotificationDeleted,
    joinNotifications,
    markNotificationAsRead
  }
}

// Hook de conveniência que combina WebSocket de chat + notificações
export const useWebSocketComplete = () => {
  const chatWebSocket = useWebSocket()
  const notificationsWebSocket = useWebSocketNotifications()

  return {
    // Chat functionality
    chat: chatWebSocket,
    
    // Notifications functionality  
    notifications: notificationsWebSocket,
    
    // Combined connection status
    isConnected: chatWebSocket.isConnected,
    isConnecting: chatWebSocket.isConnecting,
    error: chatWebSocket.error || notificationsWebSocket.error
  }
}