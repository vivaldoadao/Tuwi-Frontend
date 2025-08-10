import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
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

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Interfaces
interface AuthenticatedSocket extends ServerIO {
  userId?: string
  userEmail?: string
}

interface MessageData {
  conversationId: string
  content: string
  messageType?: 'text' | 'image' | 'file'
  replyToMessageId?: string
  tempId?: string
}

interface TypingData {
  conversationId: string
  isTyping: boolean
  userName: string
}

interface JoinRoomData {
  conversationId: string
}

// Verificar se usuário pode acessar conversa
async function canAccessConversation(userId: string, conversationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (error || !data) {
      console.error('❌ Error checking conversation access:', error)
      return false
    }

    return data.participant_1_id === userId || data.participant_2_id === userId
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
        message_type: data.messageType || 'text',
        reply_to_message_id: data.replyToMessageId
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

// Obter dados do usuário
async function getUserData(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching user data:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('❌ Error in getUserData:', error)
    return null
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (_req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('✅ Socket.io already running')
    return
  }

  console.log('🚀 Initializing Socket.io server...')

  const io = new ServerIO(res.socket.server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
  })

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        console.error('❌ No authentication token provided')
        return next(new Error('Authentication error: No token'))
      }

      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
      
      if (!decoded || !decoded.authenticated) {
        console.error('❌ Invalid token format')
        return next(new Error('Authentication error: Invalid token format'))
      }

      // Extract user information from token
      const userId = decoded.userId || `user_${decoded.timestamp}`
      const userEmail = decoded.email || 'authenticated_user@example.com'
      const userName = decoded.name || 'Authenticated User'

      console.log(`✅ User authenticated:`, {
        userId: userId.substring(0, 8) + '...',
        email: userEmail,
        name: userName
      })

      // Adicionar dados do usuário ao socket
      ;(socket as any).userId = userId
      ;(socket as any).userEmail = userEmail
      ;(socket as any).userName = userName

      console.log(`✅ WebSocket user authenticated: ${userEmail}`)
      next()
    } catch (error) {
      console.error('❌ Authentication error:', error)
      next(new Error('Authentication error'))
    }
  })

  // Conexão estabelecida
  io.on('connection', async (socket) => {
    const userId = (socket as any).userId
    const userEmail = (socket as any).userEmail
    const userName = (socket as any).userName

    console.log(`🔌 User connected: ${userEmail} (${socket.id})`)

    // Entrar em sala de conversa
    socket.on('join-conversation', async (data: JoinRoomData) => {
      try {
        console.log(`👤 ${userEmail} joining conversation: ${data.conversationId}`)

        // Verificar permissão
        const canAccess = await canAccessConversation(userId, data.conversationId)
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

    // Enviar mensagem
    socket.on('send-message', async (data: MessageData) => {
      try {
        console.log(`💬 ${userEmail} sending message to conversation: ${data.conversationId}`)

        // Verificar permissão
        const canAccess = await canAccessConversation(userId, data.conversationId)
        if (!canAccess) {
          console.error(`❌ ${userEmail} denied access to send message`)
          socket.emit('message-error', { message: 'Access denied' })
          return
        }

        // Criar mensagem no banco
        const message = await createMessage(userId, data)
        if (!message) {
          console.error('❌ Failed to create message in database')
          socket.emit('message-error', { message: 'Failed to create message' })
          return
        }

        console.log(`✅ Message created with ID: ${message.id}`)

        // Confirmar para o remetente
        socket.emit('message-sent', {
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
        })

        // Enviar para outros na conversa
        socket.to(data.conversationId).emit('new-message', {
          id: message.id,
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          content: message.content,
          messageType: message.message_type,
          timestamp: message.created_at,
          sender: message.sender
        })

        console.log(`📨 Message broadcasted to conversation ${data.conversationId}`)

      } catch (error) {
        console.error('❌ Error sending message:', error)
        socket.emit('message-error', { message: 'Error sending message' })
      }
    })

    // Indicador de digitação
    socket.on('typing', async (data: TypingData) => {
      try {
        // Verificar permissão
        const canAccess = await canAccessConversation(userId, data.conversationId)
        if (!canAccess) return

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

    // Marcar mensagem como lida
    socket.on('mark-read', async (data: { messageId: string, conversationId: string }) => {
      try {
        // Verificar permissão
        const canAccess = await canAccessConversation(userId, data.conversationId)
        if (!canAccess) return

        // Atualizar no banco
        const { error } = await supabase
          .from('messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('id', data.messageId)

        if (!error) {
          // Notificar outros na conversa
          socket.to(data.conversationId).emit('message-read', {
            messageId: data.messageId,
            readBy: userId,
            readAt: new Date().toISOString()
          })
        }

      } catch (error) {
        console.error('❌ Error marking message as read:', error)
      }
    })

    // Desconexão
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

    // Erro de conexão
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${userEmail}:`, error)
    })
  })

  res.socket.server.io = io
  console.log('✅ Socket.io server initialized successfully')
}

export default SocketHandler