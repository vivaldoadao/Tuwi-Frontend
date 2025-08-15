"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/context/auth-context'

// Types
interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'booking_request' | 'booking_confirmation'
  timestamp: string
  sender: {
    id: string
    name: string
    email: string
    avatar_url: string
  }
  tempId?: string
}

interface TypingUser {
  userId: string
  userName: string
  isTyping: boolean
  conversationId: string
}

interface UseWebSocketReturn {
  // Connection status
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  
  // Actions
  joinConversation: (conversationId: string) => void
  sendMessage: (content: string, conversationId: string, messageType?: 'text' | 'image' | 'file' | 'booking_request' | 'booking_confirmation', tempId?: string) => void
  sendTyping: (conversationId: string, isTyping: boolean) => void
  markAsRead: (messageId: string, conversationId: string) => void
  
  // Events
  onNewMessage: (callback: (message: ChatMessage) => void) => void
  onMessageSent: (callback: (data: { tempId?: string, message: ChatMessage }) => void) => void
  onUserTyping: (callback: (data: TypingUser) => void) => void
  onMessageRead: (callback: (data: { messageId: string, readBy: string, readAt: string }) => void) => void
  onUserJoined: (callback: (data: { userId: string, userName: string }) => void) => void
  onUserLeft: (callback: (data: { userId: string, userName: string }) => void) => void
  
  // Cleanup
  disconnect: () => void
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const eventCallbacks = useRef<Map<string, Function[]>>(new Map())
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Criar token JWT para autenticação (será obtido via API)
  const createAuthToken = useCallback(async () => {
    if (!user) return null
    
    try {
      console.log('🔑 Fetching WebSocket auth token...')
      const response = await fetch('/api/socket/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to get auth token: ${errorData.error || response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Auth token received:', { hasToken: !!data.token })
      return data.token
    } catch (error) {
      console.error('❌ Error creating auth token:', error)
      return null
    }
  }, [user])

  // Conectar ao WebSocket
  const connect = useCallback(async () => {
    if (!user || socketRef.current?.connected) return

    console.log('🔌 Connecting to WebSocket server...')
    setIsConnecting(true)
    setError(null)

    try {
      // Get auth token for WebSocket connection
      console.log('🔗 Attempting to connect to Socket.io server...')
      const token = await createAuthToken()
      
      // Use dynamic port detection or default to development port
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000'
      
      console.log('🌐 Connecting to:', baseUrl + '/api/socket/io')
      console.log('🎫 Using auth token:', !!token)
      
      const socket = io(baseUrl, {
        path: '/api/socket/io',
        auth: {
          token: token
        },
        transports: ['polling', 'websocket'], // Try polling first
        timeout: 15000,
        reconnection: false, // Disable auto-reconnection for testing
        forceNew: true
      })
      
      console.log('📡 Socket instance created, waiting for connection...')

      // Event listeners de conexão
      socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server:', socket.id)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttempts.current = 0
        
        // Test basic communication
        socket.emit('test-message', { message: 'Hello from React client!', timestamp: Date.now() })
      })

      socket.on('welcome', (data) => {
        console.log('👋 Welcome message from server:', data)
      })

      socket.on('test-response', (data) => {
        console.log('🔄 Test response from server:', data)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', {
          message: error.message,
          description: (error as any).description,
          context: (error as any).context,
          type: (error as any).type,
          url: baseUrl + '/api/socket/io'
        })
        setError(`Connection error: ${error.message}`)
        setIsConnecting(false)
        setIsConnected(false)
        reconnectAttempts.current++
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached')
          socket.disconnect()
        }
      })

      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket server:', reason)
        setIsConnected(false)
        setIsConnecting(false)
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          setTimeout(() => {
            if (reconnectAttempts.current < maxReconnectAttempts) {
              connect()
            }
          }, 2000)
        }
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
      })

      socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error.message)
        setError(`Reconnection error: ${error.message}`)
      })

      socket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed')
        setError('Failed to reconnect to server')
        setIsConnecting(false)
      })

      // Event listeners de mensagens
      socket.on('new-message', (message: ChatMessage) => {
        console.log('📨 New message received:', message)
        triggerCallback('new-message', message)
      })

      socket.on('message-sent', (data: { tempId?: string, message: ChatMessage }) => {
        console.log('✅ Message sent confirmation:', data)
        triggerCallback('message-sent', data)
      })

      socket.on('message-error', (error) => {
        // Verificar se o erro tem conteúdo significativo
        const hasContent = error && (
          error.message || 
          (typeof error === 'object' && Object.keys(error).length > 0 && !Array.isArray(error)) ||
          (typeof error === 'string' && error.trim().length > 0)
        )
        
        if (hasContent) {
          console.error('❌ Message error:', error)
          setError(error?.message || 'Erro desconhecido na mensagem')
        } else {
          // Erro vazio ou sem conteúdo, não logar no console
          // console.warn('⚠️ Empty message error received (ignoring)')
        }
      })

      socket.on('user-typing', (data: TypingUser) => {
        console.log('⌨️ User typing:', data)
        triggerCallback('user-typing', data)
      })

      socket.on('message-read', (data) => {
        console.log('👁️ Message read:', data)
        triggerCallback('message-read', data)
      })

      socket.on('user-joined', (data) => {
        console.log('👋 User joined:', data)
        triggerCallback('user-joined', data)
      })

      socket.on('user-left', (data) => {
        console.log('👋 User left:', data)
        triggerCallback('user-left', data)
      })

      socket.on('error', (error) => {
        console.error('❌ Socket error DETAILED:', {
          message: error.message,
          type: error.type,
          description: error.description,
          code: error.code,
          stack: error.stack,
          fullError: error,
          stringified: JSON.stringify(error)
        })
        setError(error.message || 'Unknown socket error')
      })

      socketRef.current = socket

    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error)
      setError(error instanceof Error ? error.message : 'Connection failed')
      setIsConnecting(false)
    }
  }, [user, createAuthToken])

  // Disparar callbacks
  const triggerCallback = useCallback((eventName: string, data: any) => {
    const callbacks = eventCallbacks.current.get(eventName) || []
    callbacks.forEach(callback => callback(data))
  }, [])

  // Registrar callback de evento
  const registerCallback = useCallback((eventName: string, callback: Function) => {
    const callbacks = eventCallbacks.current.get(eventName) || []
    callbacks.push(callback)
    eventCallbacks.current.set(eventName, callbacks)
    
    // Retornar função de cleanup
    return () => {
      const updatedCallbacks = eventCallbacks.current.get(eventName)?.filter(cb => cb !== callback) || []
      eventCallbacks.current.set(eventName, updatedCallbacks)
    }
  }, [])

  // Actions
  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Cannot join conversation: not connected')
      return
    }

    console.log(`👤 Joining conversation: ${conversationId}`)
    socketRef.current.emit('join-conversation', { conversationId })
  }, [])

  const sendMessage = useCallback((
    content: string, 
    conversationId: string, 
    messageType: 'text' | 'image' | 'file' | 'booking_request' | 'booking_confirmation' = 'text',
    tempId?: string
  ) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Cannot send message: not connected')
      return
    }

    console.log(`📤 Sending message to conversation: ${conversationId}`)
    socketRef.current.emit('send-message', {
      content,
      conversationId,
      messageType,
      tempId
    })
  }, [])

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!socketRef.current?.connected) return

    socketRef.current.emit('typing', {
      conversationId,
      isTyping,
      userName: user?.name || 'Usuário'
    })
  }, [user?.name])

  const markAsRead = useCallback((messageId: string, conversationId: string) => {
    if (!socketRef.current?.connected) return

    socketRef.current.emit('mark-read', {
      messageId,
      conversationId
    })
  }, [])

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...')
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
    setError(null)
  }, [])

  // Event handlers
  const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
    return registerCallback('new-message', callback)
  }, [registerCallback])

  const onMessageSent = useCallback((callback: (data: { tempId?: string, message: ChatMessage }) => void) => {
    return registerCallback('message-sent', callback)
  }, [registerCallback])

  const onUserTyping = useCallback((callback: (data: TypingUser) => void) => {
    return registerCallback('user-typing', callback)
  }, [registerCallback])

  const onMessageRead = useCallback((callback: (data: { messageId: string, readBy: string, readAt: string }) => void) => {
    return registerCallback('message-read', callback)
  }, [registerCallback])

  const onUserJoined = useCallback((callback: (data: { userId: string, userName: string }) => void) => {
    return registerCallback('user-joined', callback)
  }, [registerCallback])

  const onUserLeft = useCallback((callback: (data: { userId: string, userName: string }) => void) => {
    return registerCallback('user-left', callback)
  }, [registerCallback])

  // Conectar automaticamente quando usuário estiver disponível
  useEffect(() => {
    if (user && !socketRef.current) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    joinConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    onNewMessage,
    onMessageSent,
    onUserTyping,
    onMessageRead,
    onUserJoined,
    onUserLeft,
    disconnect
  }
}