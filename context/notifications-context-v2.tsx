"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications"
import { useAuth } from "@/context/auth-context"

// NOTIFICAÇÕES TEMPORARIAMENTE DESABILITADAS PARA TESTES
const NOTIFICATIONS_DISABLED = true

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order' | 'message' | 'booking' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  isImportant: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    orderId?: string
    braiderId?: string
    userId?: string
    messageId?: string
    bookingId?: string
  }
}

export interface Toast {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationsContextType {
  // Notifications (agora do banco de dados)
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  refreshNotifications: () => Promise<void>
  
  // Toasts (mantém comportamento local para UX imediata)
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (toastId: string) => void
  
  // Settings (agora do banco de dados)
  notificationSettings: {
    enableToasts: boolean
    enableSound: boolean
    enableDesktop: boolean
    autoMarkAsRead: boolean
  }
  updateNotificationSettings: (settings: Partial<NotificationsContextType['notificationSettings']>) => Promise<void>
  
  // Connection status
  isConnected: boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProviderV2({ children }: { children: React.ReactNode }) {
  // Se notificações estiverem desabilitadas, retornar provider vazio
  if (NOTIFICATIONS_DISABLED) {
    const defaultContext: NotificationsContextType = {
      notifications: [],
      toasts: [],
      unreadCount: 0,
      loading: false,
      error: null,
      notificationSettings: {
        enableToasts: true,
        enableSound: true,
        enableDesktop: false,
        autoMarkAsRead: false
      },
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
      clearAllNotifications: () => {},
      addToast: () => {},
      removeToast: () => {},
      updateSettings: () => {},
      loadNotifications: async () => {},
      isConnected: false
    }
    
    return (
      <NotificationsContext.Provider value={defaultContext}>
        {children}
      </NotificationsContext.Provider>
    )
  }

  const { user } = useAuth()
  const {
    isConnected,
    onNewNotification,
    onNotificationRead,
    onNotificationDeleted,
    markNotificationAsRead
  } = useWebSocketNotifications()

  // Estados
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notificationSettings, setNotificationSettings] = useState({
    enableToasts: true,
    enableSound: true,
    enableDesktop: false,
    autoMarkAsRead: false
  })

  // Carregar notificações do banco de dados
  const loadNotifications = useCallback(async (page = 1, limit = 50) => {
    if (!user) return

    try {
      setError(null)
      const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      
      console.log(`✅ Loaded ${data.notifications?.length || 0} notifications from database`)
    } catch (err) {
      console.error('❌ Error loading notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Carregar configurações do banco de dados
  const loadSettings = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications/settings')
      
      if (!response.ok) {
        throw new Error('Failed to load notification settings')
      }

      const data = await response.json()
      if (data.settings) {
        setNotificationSettings({
          enableToasts: data.settings.enable_toasts,
          enableSound: data.settings.enable_sound,
          enableDesktop: data.settings.enable_desktop,
          autoMarkAsRead: data.settings.auto_mark_as_read
        })
      }
    } catch (err) {
      console.error('❌ Error loading notification settings:', err)
      // Usar configurações padrão em caso de erro
    }
  }, [user])

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadNotifications()
      loadSettings()
    }
  }, [user, loadNotifications, loadSettings])

  // Configurar listeners do WebSocket
  useEffect(() => {
    if (!isConnected) return

    // Listener para novas notificações
    const unsubscribeNewNotification = onNewNotification((socketNotification) => {
      console.log('🔔 Received new notification via socket:', socketNotification)
      
      const notification: Notification = {
        id: socketNotification.id,
        type: socketNotification.type,
        title: socketNotification.title,
        message: socketNotification.message,
        timestamp: socketNotification.timestamp,
        isRead: socketNotification.isRead,
        isImportant: socketNotification.isImportant,
        actionUrl: socketNotification.actionUrl,
        actionLabel: socketNotification.actionLabel,
        metadata: socketNotification.metadata
      }

      // Adicionar à lista local
      setNotifications(prev => [notification, ...prev])

      // Mostrar toast se habilitado
      if (notificationSettings.enableToasts) {
        showToast({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          duration: notification.isImportant ? 8000 : 5000
        })
      }

      // Tocar som se habilitado
      if (notificationSettings.enableSound) {
        playNotificationSound(notification.type)
      }

      // Mostrar notificação desktop se habilitado
      if (notificationSettings.enableDesktop && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/wilnara-logo.png",
            tag: notification.id
          })
        }
      }
    })

    // Listener para notificação marcada como lida
    const unsubscribeNotificationRead = onNotificationRead((data) => {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === data.notificationId 
            ? { ...notification, isRead: data.isRead }
            : notification
        )
      )
    })

    // Listener para notificação deletada
    const unsubscribeNotificationDeleted = onNotificationDeleted((data) => {
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId))
    })

    return () => {
      unsubscribeNewNotification()
      unsubscribeNotificationRead()
      unsubscribeNotificationDeleted()
    }
  }, [isConnected, onNewNotification, onNotificationRead, onNotificationDeleted, notificationSettings])

  // Actions
  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          isImportant: notificationData.isImportant,
          actionUrl: notificationData.actionUrl,
          actionLabel: notificationData.actionLabel,
          metadata: notificationData.metadata
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }

      // A notificação será adicionada via socket, não precisamos adicionar aqui
      console.log('✅ Notification created successfully')
    } catch (err) {
      console.error('❌ Error creating notification:', err)
      throw err
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Atualizar via socket também
      if (isConnected) {
        markNotificationAsRead(notificationId, true)
      }

      // Atualizar estado local imediatamente para UX responsiva
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (err) {
      console.error('❌ Error marking notification as read:', err)
      throw err
    }
  }, [isConnected, markNotificationAsRead])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
      
      await Promise.all(
        unreadIds.map(id => markAsRead(id))
      )
    } catch (err) {
      console.error('❌ Error marking all notifications as read:', err)
      throw err
    }
  }, [notifications, markAsRead])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Atualizar estado local imediatamente
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error('❌ Error deleting notification:', err)
      throw err
    }
  }, [])

  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to clear notifications')
      }

      setNotifications([])
    } catch (err) {
      console.error('❌ Error clearing notifications:', err)
      throw err
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    await loadNotifications()
  }, [loadNotifications])

  const updateNotificationSettings = useCallback(async (newSettings: Partial<NotificationsContextType['notificationSettings']>) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enableToasts: newSettings.enableToasts,
          enableSound: newSettings.enableSound,
          enableDesktop: newSettings.enableDesktop,
          autoMarkAsRead: newSettings.autoMarkAsRead
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update notification settings')
      }

      setNotificationSettings(prev => ({ ...prev, ...newSettings }))
    } catch (err) {
      console.error('❌ Error updating notification settings:', err)
      throw err
    }
  }, [])

  // Toast management (mantém comportamento local)
  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    setToasts(prev => [...prev, newToast])

    // Auto dismiss
    const duration = toastData.duration || 5000
    setTimeout(() => {
      dismissToast(newToast.id)
    }, duration)
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  // Sound function (mantém implementação original)
  const playNotificationSound = (type: NotificationType) => {
    if (typeof window === "undefined") return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const frequencies = {
        success: 800,
        error: 300,
        warning: 600,
        info: 500,
        order: 900,
        message: 700,
        booking: 850,
        system: 450
      }

      oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log("Audio not supported or failed:", error)
    }
  }

  // Request desktop notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && notificationSettings.enableDesktop) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [notificationSettings.enableDesktop])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    toasts,
    showToast,
    dismissToast,
    notificationSettings,
    updateNotificationSettings,
    isConnected
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    // Fallback during SSR
    if (typeof window === "undefined") {
      return {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        addNotification: async () => {},
        markAsRead: async () => {},
        markAllAsRead: async () => {},
        deleteNotification: async () => {},
        clearAllNotifications: async () => {},
        refreshNotifications: async () => {},
        toasts: [],
        showToast: () => {},
        dismissToast: () => {},
        notificationSettings: {
          enableToasts: true,
          enableSound: true,
          enableDesktop: false,
          autoMarkAsRead: false
        },
        updateNotificationSettings: async () => {},
        isConnected: false
      }
    }
    throw new Error("useNotifications must be used within a NotificationsProviderV2")
  }
  return context
}