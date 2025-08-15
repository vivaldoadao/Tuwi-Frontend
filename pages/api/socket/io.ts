import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Interfaces
interface MessageData {
  conversationId: string
  content: string
  messageType?: 'text' | 'image' | 'file' | 'booking_request' | 'booking_confirmation'
  tempId?: string
}

interface TypingData {
  conversationId: string
  isTyping: boolean
  userName: string
}

// Booking-specific interfaces
interface BookingSubscriptionData {
  braiderId: string
  userId: string
}

interface BookingUpdateData {
  bookingId: string
  status: string
  notes?: string
  updatedBy: string
}

interface AvailabilityUpdateData {
  braiderId: string
  availabilityId: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}

// Verificar se usuário pode acessar conversa
async function canAccessConversation(userId: string, conversationId: string): Promise<boolean> {
  try {
    console.log('🔍 === CHECKING CONVERSATION ACCESS ===')
    console.log(`👤 User ID: ${userId}`)
    console.log(`💬 Conversation ID: ${conversationId}`)
    
    const { data, error } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (error || !data) {
      console.error('❌ Error checking conversation access:', error)
      return false
    }

    console.log('📋 Conversation data:', data)
    console.log(`👤 Participant 1: ${data.participant_1_id}`)
    console.log(`👤 Participant 2: ${data.participant_2_id}`)
    console.log(`🔍 User matches participant 1: ${data.participant_1_id === userId}`)
    console.log(`🔍 User matches participant 2: ${data.participant_2_id === userId}`)

    const hasAccess = data.participant_1_id === userId || data.participant_2_id === userId
    console.log(`✅ Access granted: ${hasAccess}`)
    console.log('🔍 === ACCESS CHECK COMPLETE ===')

    return hasAccess
  } catch (error) {
    console.error('❌ Error in canAccessConversation:', error)
    return false
  }
}

// Criar mensagem no banco
async function createMessage(userId: string, data: MessageData) {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        sender_id: userId,
        content: data.content,
        message_type: data.messageType || 'text'
      })
      .select(`
        *,
        sender:users!sender_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('❌ Error creating message:', error)
      return null
    }

    return message
  } catch (error) {
    console.error('❌ Error in createMessage:', error)
    return null
  }
}

// 🔄 BOOKING FUNCTIONS

// Verificar se usuário pode acessar bookings de uma trancista (usando email como padrão do sistema)
async function canAccessBraiderBookings(userEmail: string, braiderId: string): Promise<boolean> {
  try {
    console.log('🔍 Checking braider booking access:', { userEmail, braiderId })
    
    const { data: braider, error } = await supabase
      .from('braiders')
      .select('id, contact_email, name')
      .eq('id', braiderId)
      .single()

    if (error || !braider) {
      console.error('❌ Braider not found:', error)
      return false
    }

    const hasAccess = braider.contact_email === userEmail
    console.log('✅ Braider booking access:', { hasAccess, braiderEmail: braider.contact_email, userEmail })
    
    return hasAccess
  } catch (error) {
    console.error('❌ Error checking braider booking access:', error)
    return false
  }
}

// Notificar sobre novo booking
async function notifyBookingCreated(io: any, bookingId: string) {
  try {
    console.log('📢 Notifying about new booking:', bookingId)
    
    // Buscar dados completos do booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services(name, price),
        braiders!inner(id, user_id, name)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('❌ Booking not found for notification:', error)
      return
    }

    const notification = {
      action: 'booking_created',
      bookingId: booking.id,
      braiderId: booking.braider_id,
      clientId: booking.client_id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      serviceName: booking.services?.name || 'Serviço de Tranças',
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      status: booking.status,
      totalAmount: booking.total_amount,
      timestamp: new Date().toISOString()
    }

    // Enviar para room específica da trancista
    const braiderRoom = `braider_${booking.braider_id}`
    io.to(braiderRoom).emit('new-message', {
      id: `booking_${bookingId}_${Date.now()}`,
      conversationId: braiderRoom,
      senderId: 'system',
      content: JSON.stringify(notification),
      messageType: 'booking_request',
      timestamp: notification.timestamp,
      sender: {
        id: 'system',
        name: 'Sistema',
        email: 'system@wilnara.com',
        avatar_url: null
      }
    })

    console.log('✅ Booking creation notification sent to room:', braiderRoom)
  } catch (error) {
    console.error('❌ Error notifying booking creation:', error)
  }
}

// Notificar sobre atualização de status do booking
async function notifyBookingStatusUpdate(io: any, bookingId: string, oldStatus: string, newStatus: string, updatedBy: string) {
  try {
    console.log('📢 Notifying booking status update:', { bookingId, oldStatus, newStatus })
    
    // Buscar dados do booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services(name),
        braiders!inner(id, user_id, name)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('❌ Booking not found for status update notification:', error)
      return
    }

    const notification = {
      action: 'booking_status_updated',
      bookingId: booking.id,
      braiderId: booking.braider_id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      serviceName: booking.services?.name || 'Serviço de Tranças',
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      oldStatus,
      newStatus,
      totalAmount: booking.total_amount,
      updatedBy,
      timestamp: new Date().toISOString()
    }

    // Enviar para room da trancista
    const braiderRoom = `braider_${booking.braider_id}`
    io.to(braiderRoom).emit('new-message', {
      id: `booking_update_${bookingId}_${Date.now()}`,
      conversationId: braiderRoom,
      senderId: updatedBy,
      content: JSON.stringify(notification),
      messageType: 'booking_confirmation',
      timestamp: notification.timestamp,
      sender: {
        id: updatedBy,
        name: 'Sistema',
        email: 'system@wilnara.com',
        avatar_url: null
      }
    })

    // Se cliente estiver registrado, também notificar
    if (booking.client_id) {
      const clientRoom = `client_${booking.client_id}`
      io.to(clientRoom).emit('new-message', {
        id: `booking_client_update_${bookingId}_${Date.now()}`,
        conversationId: clientRoom,
        senderId: 'system',
        content: JSON.stringify(notification),
        messageType: 'booking_confirmation',
        timestamp: notification.timestamp,
        sender: {
          id: 'system',
          name: 'Sistema',
          email: 'system@wilnara.com',
          avatar_url: null
        }
      })
    }

    console.log('✅ Booking status update notifications sent')
  } catch (error) {
    console.error('❌ Error notifying booking status update:', error)
  }
}

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIO) {
  console.log('🔌 WebSocket handler called')
  
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.io server...')

    const io = new ServerIO(res.socket.server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://yourdomain.com"] // ← Substitua pelo seu domínio em produção
          : ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      }
    })

    // Middleware de autenticação WebSocket
    io.use(async (socket, next) => {
      console.log('🔐 AUTH MIDDLEWARE CALLED')
      console.log('🔐 Socket handshake auth:', socket.handshake.auth)
      
      try {
        const token = socket.handshake.auth.token
        
        if (!token) {
          console.error('❌ No authentication token provided')
          return next(new Error('Authentication required'))
        }

        // Verificar token JWT
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        console.log('🔐 Token decoded:', { 
          hasUserId: !!decoded.userId, 
          hasEmail: !!decoded.email,
          authenticated: decoded.authenticated 
        })
        
        if (!decoded || !decoded.authenticated) {
          console.error('❌ Invalid or unauthenticated token')
          return next(new Error('Invalid authentication token'))
        }

        const userId = decoded.userId || `user_${decoded.timestamp}`
        const userEmail = decoded.email || 'authenticated_user@example.com'
        const userName = decoded.name || 'Authenticated User'

        ;(socket as any).userId = userId
        ;(socket as any).userEmail = userEmail
        ;(socket as any).userName = userName

        console.log(`✅ WebSocket user authenticated: ${userEmail} (ID: ${userId})`)
        
        // Debug: Verificar se este ID existe no banco
        const { data: userCheck } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('email', userEmail)
          .single()
        
        if (userCheck) {
          console.log('📋 User found in database:', userCheck)
          if (userCheck.id !== userId) {
            console.warn(`⚠️ ID MISMATCH! JWT token has ${userId}, but database has ${userCheck.id}`)
            // Use the correct ID from database
            ;(socket as any).userId = userCheck.id
          }
        }
        
        next()
      } catch (error) {
        console.error('❌ Authentication error:', error)
        return next(new Error('Authentication failed'))
      }
    })

    // Connection handler
    io.on('connection', (socket) => {
      const userId = (socket as any).userId
      const userEmail = (socket as any).userEmail
      const userName = (socket as any).userName

      console.log(`🔌 User connected: ${userEmail} (${socket.id})`)
      console.log('📋 Setting up event listeners...')
      
      socket.emit('welcome', { message: 'Connected to WebSocket server!' })

      // Test handlers
      socket.on('test-message', (data) => {
        console.log('📨 Test message received:', data)
        socket.emit('test-response', { echo: data, timestamp: Date.now() })
      })
      console.log('✅ test-message listener registered')

      // Join conversation
      socket.on('join-conversation', async (data: { conversationId: string }) => {
        try {
          console.log(`👤 ${userEmail} joining conversation: ${data.conversationId}`)

          // Verificar permissão (skip para teste)
          const canAccess = userId === 'guest' || await canAccessConversation(userId, data.conversationId)
          if (!canAccess) {
            console.error(`❌ ${userEmail} denied access to conversation ${data.conversationId}`)
            socket.emit('error', { message: 'Access denied to conversation', code: 'CONVERSATION_ACCESS_DENIED' })
            return
          }

          // Sair de outras salas
          Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id) {
              socket.leave(room)
            }
          })

          // Entrar na nova sala
          socket.join(data.conversationId)
          console.log(`✅ ${userEmail} joined conversation room: ${data.conversationId}`)

          // Notificar presença na conversa
          socket.to(data.conversationId).emit('user-joined', {
            userId,
            userName,
            userEmail
          })

        } catch (error) {
          console.error('❌ Error joining conversation:', error)
          socket.emit('error', { 
            message: 'Error joining conversation', 
            code: 'JOIN_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })
      console.log('✅ join-conversation listener registered')

      // Send message
      socket.on('send-message', async (data: MessageData) => {
        try {
          console.log('🚀 === SEND MESSAGE EVENT RECEIVED ===')
          console.log(`💬 User: ${userEmail} (${userId})`)
          console.log(`📋 Data:`, data)
          console.log(`🏠 Conversation: ${data.conversationId}`)
          console.log(`💭 Content: "${data.content}"`)
          console.log(`🏷️ Type: ${data.messageType || 'text'}`)
          console.log(`🆔 TempId: ${data.tempId}`)

          // Handle booking-related messages differently
          if (data.messageType === 'booking_request' || data.messageType === 'booking_confirmation') {
            console.log('🔄 Processing booking-related message')
            
            try {
              const bookingData = JSON.parse(data.content)
              
              if (bookingData.action === 'subscribe_bookings') {
                // Subscribe user to booking notifications
                const canAccess = await canAccessBraiderBookings(userEmail, bookingData.braiderId)
                if (canAccess) {
                  const braiderRoom = `braider_${bookingData.braiderId}`
                  socket.join(braiderRoom)
                  console.log(`✅ User ${userEmail} subscribed to booking notifications for braider ${bookingData.braiderId}`)
                  
                  socket.emit('message-sent', {
                    tempId: data.tempId,
                    message: {
                      id: `subscription_${Date.now()}`,
                      conversationId: data.conversationId,
                      senderId: 'system',
                      content: JSON.stringify({ action: 'subscription_confirmed', braiderId: bookingData.braiderId }),
                      messageType: 'booking_confirmation',
                      timestamp: new Date().toISOString(),
                      sender: { id: 'system', name: 'Sistema', email: 'system@wilnara.com', avatar_url: null }
                    }
                  })
                } else {
                  socket.emit('message-error', { message: 'Access denied to braider bookings', code: 'ACCESS_DENIED' })
                }
                return
              }
              
              if (bookingData.action === 'unsubscribe_bookings') {
                // Unsubscribe from booking notifications
                const braiderRoom = `braider_${bookingData.braiderId}`
                socket.leave(braiderRoom)
                console.log(`✅ User ${userEmail} unsubscribed from booking notifications`)
                return
              }
              
              if (bookingData.action === 'update_booking_status') {
                // Handle booking status update
                const canAccess = await canAccessBraiderBookings(userEmail, bookingData.braiderId || '')
                if (canAccess) {
                  // This would typically trigger a database update and then notify all relevant users
                  console.log('📝 Booking status update request:', bookingData)
                  
                  // In a real implementation, you'd update the booking status in the database here
                  // and then call notifyBookingStatusUpdate
                  
                  socket.emit('message-sent', {
                    tempId: data.tempId,
                    message: {
                      id: `booking_update_${Date.now()}`,
                      conversationId: data.conversationId,
                      senderId: userId,
                      content: JSON.stringify({ action: 'status_update_processed', bookingId: bookingData.bookingId }),
                      messageType: 'booking_confirmation',
                      timestamp: new Date().toISOString(),
                      sender: { id: userId, name: userName, email: userEmail, avatar_url: null }
                    }
                  })
                } else {
                  socket.emit('message-error', { message: 'Access denied to update booking', code: 'UPDATE_ACCESS_DENIED' })
                }
                return
              }
              
            } catch (parseError) {
              console.error('❌ Error parsing booking data:', parseError)
              socket.emit('message-error', { 
                message: 'Invalid booking data format', 
                code: 'PARSE_ERROR',
                details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
              })
              return
            }
          }

          // Regular message handling (existing chat functionality)
          // Verificar permissão de acesso
          const canAccess = await canAccessConversation(userId, data.conversationId)
          if (!canAccess) {
            console.error(`❌ ${userEmail} denied access to send message`)
            socket.emit('message-error', { message: 'Access denied to conversation', code: 'CONVERSATION_ACCESS_DENIED' })
            return
          }
          console.log('✅ Access permission verified')

          // Criar mensagem real no banco de dados
          console.log('📝 Creating real message in database...')
          const message = await createMessage(userId, data)
          if (!message) {
            console.error('❌ Failed to create message in database')
            socket.emit('message-error', { 
              message: 'Failed to create message in database', 
              code: 'DATABASE_ERROR'
            })
            return
          }
          console.log('✅ Real message created in database:', message)

          console.log(`✅ Message created with ID: ${message.id}`)

          // Confirmar para o remetente
          console.log('📤 Sending message-sent confirmation to sender...')
          const confirmationPayload = {
            tempId: data.tempId,
            message: {
              id: message.id,
              conversationId: message.conversation_id,
              senderId: message.sender_id,
              content: message.content,
              messageType: message.message_type,
              timestamp: message.created_at,
              sender: message.sender
            }
          }
          console.log('📤 Confirmation payload:', confirmationPayload)
          socket.emit('message-sent', confirmationPayload)

          // Enviar para outros na conversa (excluindo o remetente)
          console.log('📡 Broadcasting new-message to room:', data.conversationId)
          console.log('📡 Current socket rooms:', Array.from(socket.rooms))
          console.log('📡 Sockets in room:', io.sockets.adapter.rooms.get(data.conversationId))
          console.log(`📡 Sender ID: ${userId} - will NOT receive the broadcast`)
          
          const broadcastPayload = {
            id: message.id,
            conversationId: message.conversation_id,
            senderId: message.sender_id,
            content: message.content,
            messageType: message.message_type,
            timestamp: message.created_at,
            sender: message.sender
          }
          console.log('📡 Broadcast payload:', broadcastPayload)
          
          // socket.to() automaticamente exclui o remetente, mas vamos garantir
          socket.to(data.conversationId).emit('new-message', broadcastPayload)

          console.log(`📨 Message broadcasted to conversation ${data.conversationId}`)
          console.log('🚀 === SEND MESSAGE PROCESSING COMPLETE ===')

        } catch (error) {
          console.error('❌ Error sending message:', error)
          socket.emit('message-error', { 
            message: 'Error sending message', 
            code: 'SEND_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })
      console.log('✅ send-message listener registered')

      // Typing indicator
      socket.on('typing', async (data: TypingData) => {
        try {
          console.log(`⌨️ ${userEmail} typing in conversation: ${data.conversationId}`)

          // Enviar para outros na conversa (exceto remetente)
          socket.to(data.conversationId).emit('user-typing', {
            userId,
            userName,
            isTyping: data.isTyping,
            conversationId: data.conversationId
          })

        } catch (error) {
          console.error('❌ Error handling typing:', error)
        }
      })

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${userEmail} (${socket.id})`)
        
        // Notificar salas sobre desconexão
        Array.from(socket.rooms).forEach(room => {
          if (room !== socket.id) {
            socket.to(room).emit('user-left', {
              userId,
              userName,
              userEmail
            })
          }
        })
      })

      // Socket errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${userEmail}:`, error)
      })
      
      console.log('🎯 ALL EVENT LISTENERS REGISTERED FOR USER:', userEmail)
      console.log('📋 Registered events: test-message, join-conversation, send-message, typing, disconnect, error')
    })

    res.socket.server.io = io
    console.log('✅ Socket.io server initialized successfully')
  }

  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}