/**
 * 🔄 REALTIME BOOKINGS HOOK
 * 
 * Hook especializado para gerenciar bookings em tempo real usando o WebSocket existente
 */

"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuth } from '@/context/auth-context'

// Types
interface BookingNotification {
  id: string
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_updated'
  bookingId: string
  braiderId: string
  clientId?: string
  clientName: string
  clientEmail: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalAmount: number
  timestamp: string
  message: string
}

interface AvailabilityUpdate {
  braiderId: string
  availabilityId: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
  timestamp: string
}

interface BookingStatusUpdate {
  bookingId: string
  oldStatus: string
  newStatus: string
  timestamp: string
  updatedBy: string
}

interface UseRealtimeBookingsReturn {
  // Connection status
  isConnected: boolean
  
  // Notifications
  bookingNotifications: BookingNotification[]
  unreadCount: number
  
  // Actions
  markNotificationAsRead: (notificationId: string) => void
  clearAllNotifications: () => void
  subscribeToBookings: (braiderId: string) => void
  unsubscribeFromBookings: () => void
  
  // Event listeners
  onBookingCreated: (callback: (booking: BookingNotification) => void) => () => void
  onBookingStatusChanged: (callback: (update: BookingStatusUpdate) => void) => () => void
  onAvailabilityUpdated: (callback: (update: AvailabilityUpdate) => void) => () => void
  
  // Send booking-related messages
  sendBookingUpdate: (bookingId: string, status: string, notes?: string) => void
  sendAvailabilityUpdate: (availabilityData: Partial<AvailabilityUpdate>) => void
}

export const useRealtimeBookings = (): UseRealtimeBookingsReturn => {
  const { user } = useAuth()
  const webSocket = useWebSocket()
  
  // State
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [subscribedBraiderId, setSubscribedBraiderId] = useState<string | null>(null)
  
  // Refs for event callbacks
  const bookingCreatedCallbacks = useRef<((booking: BookingNotification) => void)[]>([])
  const statusChangedCallbacks = useRef<((update: BookingStatusUpdate) => void)[]>([])
  const availabilityCallbacks = useRef<((update: AvailabilityUpdate) => void)[]>([])
  
  // Helper to trigger callbacks
  const triggerCallbacks = useCallback(<T,>(callbacks: ((data: T) => void)[], data: T) => {
    callbacks.forEach(callback => callback(data))
  }, [])
  
  // Subscribe to booking events for a specific braider
  const subscribeToBookings = useCallback((braiderId: string) => {
    if (!webSocket.isConnected) {
      console.warn('⚠️ Cannot subscribe to bookings: WebSocket not connected')
      return
    }
    
    console.log(`🔔 Subscribing to booking events for braider: ${braiderId}`)
    
    // Use the existing WebSocket to send a custom event
    webSocket.sendMessage(
      JSON.stringify({ 
        action: 'subscribe_bookings',
        braiderId: braiderId,
        userId: user?.id 
      }),
      `booking_subscription_${braiderId}`,
      'booking_request'
    )
    
    setSubscribedBraiderId(braiderId)
  }, [webSocket.isConnected, webSocket.sendMessage, user?.id])
  
  // Unsubscribe from booking events
  const unsubscribeFromBookings = useCallback(() => {
    if (!subscribedBraiderId || !webSocket.isConnected) return
    
    console.log(`🔕 Unsubscribing from booking events for braider: ${subscribedBraiderId}`)
    
    webSocket.sendMessage(
      JSON.stringify({ 
        action: 'unsubscribe_bookings',
        braiderId: subscribedBraiderId,
        userId: user?.id 
      }),
      `booking_subscription_${subscribedBraiderId}`,
      'booking_request'
    )
    
    setSubscribedBraiderId(null)
  }, [subscribedBraiderId, webSocket.isConnected, webSocket.sendMessage, user?.id])
  
  // Send booking status update
  const sendBookingUpdate = useCallback((bookingId: string, status: string, notes?: string) => {
    if (!webSocket.isConnected) {
      console.warn('⚠️ Cannot send booking update: WebSocket not connected')
      return
    }
    
    try {
      console.log(`📝 Sending booking update: ${bookingId} -> ${status}`)
      
      const updateData = {
        action: 'update_booking_status',
        bookingId,
        status,
        notes,
        updatedBy: user?.id,
        timestamp: new Date().toISOString()
      }
      
      webSocket.sendMessage(
        JSON.stringify(updateData),
        `booking_update_${bookingId}`,
        'booking_confirmation'
      )
    } catch (error) {
      console.warn('⚠️ Failed to send booking update via WebSocket:', error)
    }
  }, [webSocket.isConnected, webSocket.sendMessage, user?.id])
  
  // Send availability update
  const sendAvailabilityUpdate = useCallback((availabilityData: Partial<AvailabilityUpdate>) => {
    if (!webSocket.isConnected) {
      console.warn('⚠️ Cannot send availability update: WebSocket not connected')
      return
    }
    
    console.log(`🗓️ Sending availability update:`, availabilityData)
    
    const updateData = {
      action: 'update_availability',
      ...availabilityData,
      updatedBy: user?.id,
      timestamp: new Date().toISOString()
    }
    
    webSocket.sendMessage(
      JSON.stringify(updateData),
      `availability_update_${availabilityData.availabilityId}`,
      'booking_confirmation'
    )
  }, [webSocket.isConnected, webSocket.sendMessage, user?.id])
  
  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setBookingNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } as BookingNotification & { read: boolean }
          : notification
      )
    )
    
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setBookingNotifications([])
    setUnreadCount(0)
  }, [])
  
  // Event listener registration
  const onBookingCreated = useCallback((callback: (booking: BookingNotification) => void) => {
    bookingCreatedCallbacks.current.push(callback)
    return () => {
      bookingCreatedCallbacks.current = bookingCreatedCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])
  
  const onBookingStatusChanged = useCallback((callback: (update: BookingStatusUpdate) => void) => {
    statusChangedCallbacks.current.push(callback)
    return () => {
      statusChangedCallbacks.current = statusChangedCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])
  
  const onAvailabilityUpdated = useCallback((callback: (update: AvailabilityUpdate) => void) => {
    availabilityCallbacks.current.push(callback)
    return () => {
      availabilityCallbacks.current = availabilityCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])
  
  // Listen to WebSocket messages for booking-related events
  useEffect(() => {
    const cleanup = webSocket.onNewMessage((message) => {
      console.log('📨 Received message in booking hook:', message)
      
      // Check if this is a booking-related message
      if (message.messageType === 'booking_request' || message.messageType === 'booking_confirmation') {
        try {
          const data = JSON.parse(message.content)
          console.log('📋 Parsed booking data:', data)
          
          switch (data.action) {
            case 'booking_created': {
              const notification: BookingNotification = {
                id: `booking_${data.bookingId}_${Date.now()}`,
                type: 'booking_created',
                bookingId: data.bookingId,
                braiderId: data.braiderId,
                clientId: data.clientId,
                clientName: data.clientName,
                clientEmail: data.clientEmail,
                serviceName: data.serviceName,
                bookingDate: data.bookingDate,
                bookingTime: data.bookingTime,
                status: data.status,
                totalAmount: data.totalAmount,
                timestamp: data.timestamp,
                message: `Novo agendamento de ${data.clientName} para ${new Date(data.bookingDate).toLocaleDateString('pt-BR')}`
              }
              
              setBookingNotifications(prev => [notification, ...prev.slice(0, 99)]) // Keep last 100
              setUnreadCount(prev => prev + 1)
              triggerCallbacks(bookingCreatedCallbacks.current, notification)
              break
            }
            
            case 'booking_status_updated': {
              const statusUpdate: BookingStatusUpdate = {
                bookingId: data.bookingId,
                oldStatus: data.oldStatus,
                newStatus: data.newStatus,
                timestamp: data.timestamp,
                updatedBy: data.updatedBy
              }
              
              const notification: BookingNotification = {
                id: `status_${data.bookingId}_${Date.now()}`,
                type: 'booking_updated',
                bookingId: data.bookingId,
                braiderId: data.braiderId,
                clientName: data.clientName,
                clientEmail: data.clientEmail,
                serviceName: data.serviceName,
                bookingDate: data.bookingDate,
                bookingTime: data.bookingTime,
                status: data.newStatus,
                totalAmount: data.totalAmount,
                timestamp: data.timestamp,
                message: `Agendamento ${data.bookingId.slice(-6)} atualizado para ${data.newStatus}`
              }
              
              setBookingNotifications(prev => [notification, ...prev.slice(0, 99)])
              setUnreadCount(prev => prev + 1)
              triggerCallbacks(statusChangedCallbacks.current, statusUpdate)
              break
            }
            
            case 'availability_updated': {
              const availabilityUpdate: AvailabilityUpdate = {
                braiderId: data.braiderId,
                availabilityId: data.availabilityId,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                isBooked: data.isBooked,
                timestamp: data.timestamp
              }
              
              triggerCallbacks(availabilityCallbacks.current, availabilityUpdate)
              break
            }
          }
        } catch (error) {
          console.error('❌ Error parsing booking message:', error)
        }
      }
    })
    
    return cleanup
  }, [webSocket, triggerCallbacks])
  
  // Auto-subscribe if user is a braider
  useEffect(() => {
    if (user?.role === 'braider' && webSocket.isConnected && !subscribedBraiderId) {
      // In a real app, you'd get the braider ID from the user data
      // For now, we'll use user ID - the dashboard component will call subscribeToBookings manually
      console.log('👤 User is braider, will subscribe when braider ID is available')
    }
  }, [user, webSocket.isConnected, subscribedBraiderId])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromBookings()
    }
  }, [unsubscribeFromBookings])
  
  return {
    isConnected: webSocket.isConnected,
    bookingNotifications,
    unreadCount,
    markNotificationAsRead,
    clearAllNotifications,
    subscribeToBookings,
    unsubscribeFromBookings,
    onBookingCreated,
    onBookingStatusChanged,
    onAvailabilityUpdated,
    sendBookingUpdate,
    sendAvailabilityUpdate
  }
}