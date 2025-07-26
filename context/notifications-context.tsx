"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

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
  // Notifications
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  
  // Toasts
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (toastId: string) => void
  
  // Settings
  notificationSettings: {
    enableToasts: boolean
    enableSound: boolean
    enableDesktop: boolean
    autoMarkAsRead: boolean
  }
  updateNotificationSettings: (settings: Partial<NotificationsContextType['notificationSettings']>) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

// Mock initial notifications
const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "order",
    title: "Pedido Confirmado",
    message: "Seu pedido #12345 foi confirmado e está sendo preparado.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    isRead: false,
    isImportant: true,
    actionUrl: "/dashboard/orders/12345",
    actionLabel: "Ver Pedido",
    metadata: { orderId: "12345" }
  },
  {
    id: "notif-2",
    type: "message",
    title: "Nova Mensagem",
    message: "Sofia Santos enviou uma nova mensagem sobre seu agendamento.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: false,
    isImportant: false,
    actionUrl: "/messages?conversation=conv-1",
    actionLabel: "Ver Mensagem",
    metadata: { braiderId: "braider-1", messageId: "msg-123" }
  },
  {
    id: "notif-3",
    type: "booking",
    title: "Agendamento Confirmado",
    message: "Seu agendamento com Maria Silva foi confirmado para amanhã às 14h.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    isRead: true,
    isImportant: true,
    actionUrl: "/profile",
    actionLabel: "Ver Agendamentos",
    metadata: { braiderId: "braider-2", bookingId: "booking-456" }
  },
  {
    id: "notif-4",
    type: "success",
    title: "Produto Adicionado aos Favoritos",
    message: "Extensão de Cabelo Cacheado foi adicionado aos seus favoritos.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    isRead: true,
    isImportant: false,
    actionUrl: "/favorites",
    actionLabel: "Ver Favoritos"
  },
  {
    id: "notif-5",
    type: "system",
    title: "Bem-vinda ao Wilnara Tranças!",
    message: "Explore nossos produtos e encontre as melhores trancistas da região.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    isImportant: false,
    actionUrl: "/products",
    actionLabel: "Explorar"
  }
]

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    enableToasts: true,
    enableSound: true,
    enableDesktop: false,
    autoMarkAsRead: false
  })

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadNotifications = () => {
      try {
        if (typeof window === "undefined") return
        
        const savedNotifications = localStorage.getItem("wilnara_notifications")
        const savedSettings = localStorage.getItem("wilnara_notification_settings")
        
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications)
            if (Array.isArray(parsed)) {
              setNotifications(parsed)
            } else {
              setNotifications(mockNotifications)
            }
          } catch (error) {
            console.error("Error parsing notifications:", error)
            setNotifications(mockNotifications)
          }
        } else {
          // Use mock data for new users
          setNotifications(mockNotifications)
        }
        
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings)
            if (parsed && typeof parsed === 'object') {
              setNotificationSettings(parsed)
            }
          } catch (error) {
            console.error("Error parsing notification settings:", error)
          }
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error("Error loading notifications:", error)
        setNotifications(mockNotifications)
        setIsInitialized(true)
      }
    }

    // Delay to ensure proper hydration
    const timer = setTimeout(loadNotifications, 100)
    return () => clearTimeout(timer)
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("wilnara_notifications", JSON.stringify(notifications))
    }
  }, [notifications, isInitialized])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("wilnara_notification_settings", JSON.stringify(notificationSettings))
    }
  }, [notificationSettings, isInitialized])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Show toast if enabled
    if (notificationSettings.enableToasts) {
      showToast({
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        duration: newNotification.isImportant ? 8000 : 5000
      })
    }

    // Play sound if enabled
    if (notificationSettings.enableSound) {
      playNotificationSound(newNotification.type)
    }

    // Show desktop notification if enabled and permission granted
    if (notificationSettings.enableDesktop && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: "/wilnara-logo.png",
          tag: newNotification.id
        })
      }
    }
  }, [notificationSettings])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }, [])

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    setToasts(prev => [...prev, newToast])

    // Auto dismiss after duration
    const duration = toastData.duration || 5000
    setTimeout(() => {
      dismissToast(newToast.id)
    }, duration)
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationsContextType['notificationSettings']>) => {
    setNotificationSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Function to play notification sounds
  const playNotificationSound = (type: NotificationType) => {
    if (typeof window === "undefined") return
    
    try {
      // Create audio context for different notification types
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Different frequencies for different notification types
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

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    toasts,
    showToast,
    dismissToast,
    notificationSettings,
    updateNotificationSettings
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
    // Instead of throwing, return a safe fallback during SSR/hydration issues
    if (typeof window === "undefined") {
      return {
        notifications: [],
        unreadCount: 0,
        addNotification: () => {},
        markAsRead: () => {},
        markAllAsRead: () => {},
        deleteNotification: () => {},
        clearAllNotifications: () => {},
        toasts: [],
        showToast: () => {},
        dismissToast: () => {},
        notificationSettings: {
          enableToasts: true,
          enableSound: true,
          enableDesktop: false,
          autoMarkAsRead: false
        },
        updateNotificationSettings: () => {}
      }
    }
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}