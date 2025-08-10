"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/context/auth-context'
import { useUserPresence } from './useUserPresence'

// Types
interface ChatUser {
  id: string
  name: string
  email: string
  avatar: string
  isOnline: boolean
  lastSeen: string
}

interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'booking_request' | 'booking_confirmation'
  attachments: string[]
  metadata?: any
  isDelivered: boolean
  isRead: boolean
  readAt?: string
  replyToMessageId?: string
  isEdited: boolean
  editedAt?: string
  timestamp: string
  updatedAt: string
  sender: ChatUser
  replyTo?: {
    id: string
    content: string
    senderId: string
  }
}

interface ChatConversation {
  id: string
  status: 'active' | 'archived' | 'blocked'
  title?: string
  participant: ChatUser
  lastMessage: {
    content: string
    timestamp: string
    isRead: boolean
    sender: 'current' | 'other'
  }
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface UseRealtimeChatReturn {
  // Conversations
  conversations: ChatConversation[]
  loadingConversations: boolean
  conversationsError: string | null
  
  // Current conversation
  selectedConversation: ChatConversation | null
  setSelectedConversation: (conversation: ChatConversation | null) => void
  
  // Messages
  messages: ChatMessage[]
  loadingMessages: boolean
  messagesError: string | null
  hasMoreMessages: boolean
  
  // Actions
  sendMessage: (content: string, type?: ChatMessage['messageType'], attachments?: string[], replyToId?: string) => Promise<boolean>
  sendingMessage: boolean
  loadMoreMessages: () => Promise<void>
  markAsRead: (messageId: string) => Promise<boolean>
  createConversation: (participantId: string, initialMessage?: string) => Promise<string | null>
  
  // Real-time status
  isConnected: boolean
  typingUsers: string[]
  
  // Message delivery status
  getMessageStatus: (messageId: string) => 'sending' | 'sent' | 'delivered' | 'read' | null
  
  // Typing indicator functions
  handleTyping: () => void
  stopTyping: () => void
  
  // Utility functions
  refreshConversations: () => Promise<void>
  refreshMessages: () => Promise<void>
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const useRealtimeChat = (): UseRealtimeChatReturn => {
  const { user } = useAuth()
  const { getUserPresence, getMultiplePresence } = useUserPresence()
  
  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [conversationsError, setConversationsError] = useState<string | null>(null)
  
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<Map<string, 'sending' | 'sent' | 'delivered' | 'read'>>(new Map())
  
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // Refs for managing subscriptions
  const conversationChannel = useRef<any>(null)
  const messageChannel = useRef<any>(null)
  const messagesOffset = useRef(0)

  // Load conversations
  const refreshConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoadingConversations(true)
      setConversationsError(null)
      
      const response = await fetch('/api/conversations')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar conversas')
      }
      
      console.log('📞 Conversations loaded:', data.conversations?.length || 0)
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('❌ Error loading conversations:', error)
      setConversationsError(error instanceof Error ? error.message : 'Erro ao carregar conversas')
    } finally {
      setLoadingConversations(false)
    }
  }, [user])

  // Load messages for selected conversation
  const refreshMessages = useCallback(async () => {
    if (!selectedConversation) return

    try {
      setLoadingMessages(true)
      setMessagesError(null)
      messagesOffset.current = 0
      
      const response = await fetch(
        `/api/conversations/${selectedConversation.id}/messages?limit=50&offset=0`
      )
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar mensagens')
      }
      
      console.log('💬 Messages loaded:', data.messages?.length || 0)
      setMessages(data.messages || [])
      setHasMoreMessages(data.hasMore || false)
      messagesOffset.current = data.messages?.length || 0
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      setMessagesError(error instanceof Error ? error.message : 'Erro ao carregar mensagens')
    } finally {
      setLoadingMessages(false)
    }
  }, [selectedConversation])

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || loadingMessages || !hasMoreMessages) return

    try {
      setLoadingMessages(true)
      
      const response = await fetch(
        `/api/conversations/${selectedConversation.id}/messages?limit=50&offset=${messagesOffset.current}`
      )
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar mais mensagens')
      }
      
      console.log('📖 More messages loaded:', data.messages?.length || 0)
      setMessages(prev => [...(data.messages || []), ...prev]) // Prepend older messages
      setHasMoreMessages(data.hasMore || false)
      messagesOffset.current += data.messages?.length || 0
    } catch (error) {
      console.error('❌ Error loading more messages:', error)
      setMessagesError(error instanceof Error ? error.message : 'Erro ao carregar mais mensagens')
    } finally {
      setLoadingMessages(false)
    }
  }, [selectedConversation, loadingMessages, hasMoreMessages])

  // Send message with delivery status
  const sendMessage = useCallback(async (
    content: string, 
    messageType: ChatMessage['messageType'] = 'text',
    attachments: string[] = [],
    replyToId?: string
  ): Promise<boolean> => {
    if (!selectedConversation || !content.trim()) return false

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Add optimistic message immediately
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: user!.id,
      content: content.trim(),
      messageType,
      attachments: attachments || [],
      metadata: null,
      isDelivered: false,
      isRead: false,
      readAt: undefined,
      replyToMessageId: replyToId,
      isEdited: false,
      editedAt: undefined,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: {
        id: user!.id,
        name: user!.name || 'Você',
        email: user!.email || '',
        avatar: user!.image || `/placeholder.svg?height=40&width=40&text=${user!.name?.[0] || 'U'}`,
        isOnline: true,
        lastSeen: new Date().toISOString()
      }
    }

    // Add to messages with sending status
    setMessages(prev => [...prev, optimisticMessage])
    setMessageDeliveryStatus(prev => {
      const newMap = new Map(prev)
      newMap.set(tempId, 'sending')
      return newMap
    })

    try {
      setSendingMessage(true)
      
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          messageType,
          attachments,
          replyToMessageId: replyToId
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }
      
      console.log('✅ Message sent successfully!')
      console.log('📨 Message data:', data.message)
      console.log('🆔 Message ID:', data.message.id)
      console.log('📝 Message content:', data.message.content)
      console.log('👤 Sender ID:', data.message.senderId)
      console.log('💬 Conversation ID:', data.message.conversationId)
      
      // Replace temporary message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...data.message, id: data.message.id }
          : msg
      ))
      
      // Update delivery status
      setMessageDeliveryStatus(prev => {
        const newMap = new Map(prev)
        newMap.delete(tempId) // Remove temp status
        newMap.set(data.message.id, 'sent')
        return newMap
      })
      
      return true
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setMessagesError(error instanceof Error ? error.message : 'Erro ao enviar mensagem')
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessageDeliveryStatus(prev => {
        const newMap = new Map(prev)
        newMap.delete(tempId)
        return newMap
      })
      
      return false
    } finally {
      setSendingMessage(false)
    }
  }, [selectedConversation, user])

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao marcar mensagem como lida')
      }
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRead: true, readAt: new Date().toISOString() }
          : msg
      ))
      
      return true
    } catch (error) {
      console.error('❌ Error marking message as read:', error)
      return false
    }
  }, [])

  // Create new conversation
  const createConversation = useCallback(async (
    participantId: string, 
    initialMessage?: string
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          initialMessage
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conversa')
      }
      
      console.log('✅ Conversation created:', data.conversationId)
      
      // Refresh conversations to get the new one
      await refreshConversations()
      
      return data.conversationId
    } catch (error) {
      console.error('❌ Error creating conversation:', error)
      setConversationsError(error instanceof Error ? error.message : 'Erro ao criar conversa')
      return null
    }
  }, [refreshConversations])

  // Get message delivery status
  const getMessageStatus = useCallback((messageId: string): 'sending' | 'sent' | 'delivered' | 'read' | null => {
    return messageDeliveryStatus.get(messageId) || null
  }, [messageDeliveryStatus])

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (typing: boolean) => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isTyping: typing
        })
      })
      
      if (!response.ok) {
        console.error('Failed to send typing indicator')
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }, [selectedConversation])

  // Handle user typing
  const handleTyping = useCallback(() => {
    if (!selectedConversation) return

    // Send typing indicator if not already typing
    if (!isTyping) {
      setIsTyping(true)
      sendTypingIndicator(true)
    }

    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
    }

    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingIndicator(false)
    }, 3000)
  }, [selectedConversation, isTyping, sendTypingIndicator])

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
    }
    if (isTyping) {
      setIsTyping(false)
      sendTypingIndicator(false)
    }
  }, [isTyping, sendTypingIndicator])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    console.log('🔌 Setting up real-time subscriptions for user:', user.email)
    setIsConnected(true)

    // Subscribe to conversation changes (new conversations, last message updates)
    conversationChannel.current = supabase
      .channel('user_conversations')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('🆕 New conversation created:', payload.new)
          // Check if current user is a participant in this conversation
          const newConversation = payload.new as any
          if (newConversation.participant_1_id === user.id || newConversation.participant_2_id === user.id) {
            console.log('🔔 New conversation notification - user is participant')
            // Show notification for new conversation
            // Refresh conversations to get the new one with proper formatting
            setTimeout(() => {
              refreshConversations()
            }, 500)
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('🔄 Conversation updated:', payload.new)
          // Check if current user is a participant
          const updatedConversation = payload.new as any
          if (updatedConversation.participant_1_id === user.id || updatedConversation.participant_2_id === user.id) {
            // Refresh conversations to reflect changes (like new last message)
            refreshConversations()
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversation subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      console.log('🔌 Cleaning up conversation subscription')
      if (conversationChannel.current) {
        supabase.removeChannel(conversationChannel.current)
        conversationChannel.current = null
      }
      setIsConnected(false)
    }
  }, [user, refreshConversations])

  // Set up message real-time subscription for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) {
      if (messageChannel.current) {
        supabase.removeChannel(messageChannel.current)
        messageChannel.current = null
      }
      return
    }

    console.log('💬 Setting up message subscription for conversation:', selectedConversation.id)
    console.log('👤 Current user ID:', user.id)
    console.log('📋 Selected conversation:', selectedConversation)
    
    // Test Supabase connection
    console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // Test channel creation
    console.log('📺 Creating channel:', `messages:${selectedConversation.id}`)
    console.log('⚙️ Filter:', `conversation_id=eq.${selectedConversation.id}`)

    // Subscribe to new messages and typing indicators in this conversation
    messageChannel.current = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        async (payload) => {
          console.log('📨 New message received via real-time:', payload)
          
          const newMessage = payload.new as any
          
          // Skip if this message is from current user (already added optimistically)
          if (newMessage.sender_id === user.id) {
            console.log('⏭️ Skipping own message (already added optimistically)')
            return
          }
          
          console.log('🚀 Processing incoming message from other user immediately')
          
          try {
            // Get sender info for the new message
            const { data: senderData } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .eq('id', newMessage.sender_id)
              .single()
            
            // Create complete message object
            const completeMessage: ChatMessage = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              messageType: newMessage.message_type || 'text',
              attachments: newMessage.attachments || [],
              metadata: newMessage.metadata,
              isDelivered: newMessage.is_delivered || false,
              isRead: newMessage.is_read || false,
              readAt: newMessage.read_at,
              replyToMessageId: newMessage.reply_to_message_id,
              isEdited: newMessage.is_edited || false,
              editedAt: newMessage.edited_at,
              timestamp: newMessage.created_at,
              updatedAt: newMessage.updated_at || newMessage.created_at,
              sender: {
                id: senderData?.id || newMessage.sender_id,
                name: senderData?.name || 'Usuário',
                email: senderData?.email || '',
                avatar: senderData?.avatar_url || `/placeholder.svg?height=40&width=40&text=${senderData?.name?.[0] || 'U'}`,
                isOnline: false, // Will be updated by presence system
                lastSeen: new Date().toISOString()
              }
            }
            
            console.log('✅ Adding new message to chat:', completeMessage.content)
            
            // Add message immediately to the list
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(m => m.id === completeMessage.id)
              if (exists) {
                console.log('⚠️ Message already exists, skipping')
                return prev
              }
              
              // Add new message at the end
              const newMessages = [...prev, completeMessage]
              console.log('📊 Total messages after adding:', newMessages.length)
              return newMessages
            })
            
            // Play notification sound/effect for new message
            console.log('🔔 New message notification from:', completeMessage.sender.name)
            
            // Update conversation list to show latest message
            setConversations(prev => prev.map(conv => {
              if (conv.id === selectedConversation.id) {
                return {
                  ...conv,
                  lastMessage: {
                    content: completeMessage.content,
                    timestamp: new Date(completeMessage.timestamp).toLocaleTimeString('pt-PT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }),
                    isRead: false,
                    sender: 'other'
                  },
                  unreadCount: conv.unreadCount + 1
                }
              }
              return conv
            }))
            
          } catch (error) {
            console.error('❌ Error processing real-time message:', error)
            // Fallback: refresh messages if direct processing fails
            console.log('🔄 Falling back to refresh messages')
            setTimeout(() => {
              refreshMessages()
            }, 100)
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          console.log('📝 Message updated:', payload.new)
          
          // Update message in state
          const updatedMessage = payload.new as any
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { ...msg, isRead: updatedMessage.is_read, readAt: updatedMessage.read_at }
              : msg
          ))
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          console.log('⌨️ Typing indicator change:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typing = payload.new as any
            if (typing.user_id !== user.id && typing.is_typing) {
              // Add user to typing list if not current user and is typing
              setTypingUsers(prev => {
                if (!prev.includes(typing.user_id)) {
                  return [...prev, typing.user_id]
                }
                return prev
              })
              
              // Auto-remove after 5 seconds if no further updates
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(id => id !== typing.user_id))
              }, 5000)
            }
          } else if (payload.eventType === 'DELETE') {
            const typing = payload.old as any
            if (typing.user_id !== user.id) {
              // Remove user from typing list
              setTypingUsers(prev => prev.filter(id => id !== typing.user_id))
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Message subscription status:', status)
        console.log('🔗 Channel name:', `messages:${selectedConversation.id}`)
        console.log('👤 User ID:', user.id)
        console.log('🕐 Timestamp:', new Date().toISOString())
        
        if (err) {
          console.error('❌ Subscription error:', err)
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time message subscription ACTIVE!')
          console.log('🎯 Listening for messages in conversation:', selectedConversation.id)
          console.log('🚀 Ready to receive real-time messages!')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time message subscription FAILED!')
          console.error('💡 Check: RLS policies, Supabase real-time settings')
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Real-time message subscription CLOSED')
        }
      })

    return () => {
      console.log('🔌 Cleaning up message subscription')
      if (messageChannel.current) {
        supabase.removeChannel(messageChannel.current)
        messageChannel.current = null
      }
    }
  }, [selectedConversation, user])

  // Load initial data
  useEffect(() => {
    if (user) {
      refreshConversations()
    }
  }, [user, refreshConversations])

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      refreshMessages()
    } else {
      setMessages([])
    }
  }, [selectedConversation, refreshMessages])

  return {
    // Conversations
    conversations,
    loadingConversations,
    conversationsError,
    
    // Current conversation
    selectedConversation,
    setSelectedConversation,
    
    // Messages
    messages,
    loadingMessages,
    messagesError,
    hasMoreMessages,
    
    // Actions
    sendMessage,
    sendingMessage,
    loadMoreMessages,
    markAsRead,
    createConversation,
    
    // Real-time status
    isConnected,
    typingUsers,
    
    // Message delivery status
    getMessageStatus,
    
    // Typing indicator functions
    handleTyping,
    stopTyping,
    
    // Utility functions
    refreshConversations,
    refreshMessages
  }
}