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
  messageType?: 'text' | 'image' | 'file'
  tempId?: string
}

interface TypingData {
  conversationId: string
  isTyping: boolean
  userName: string
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
            socket.emit('error', { message: 'Access denied to conversation' })
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
          socket.emit('error', { message: 'Error joining conversation' })
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

          // Verificar permissão de acesso
          const canAccess = await canAccessConversation(userId, data.conversationId)
          if (!canAccess) {
            console.error(`❌ ${userEmail} denied access to send message`)
            socket.emit('message-error', { message: 'Access denied' })
            return
          }
          console.log('✅ Access permission verified')

          // Criar mensagem real no banco de dados
          console.log('📝 Creating real message in database...')
          const message = await createMessage(userId, data)
          if (!message) {
            console.error('❌ Failed to create message in database')
            socket.emit('message-error', { message: 'Failed to create message' })
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
          socket.emit('message-error', { message: 'Error sending message' })
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