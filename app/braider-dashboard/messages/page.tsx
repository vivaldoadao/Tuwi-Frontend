"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BraiderDashboardContentWrapper } from "@/components/braider-dashboard-content-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"
import { getBraiderById, type Braider } from "@/lib/data"
import { 
  MessageSquare, 
  Search, 
  Send, 
  User, 
  Clock, 
  CheckCircle,
  Circle,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Image as ImageIcon,
  ArrowLeft,
  Settings,
  Archive,
  Star,
  Filter,
  Plus,
  Calendar,
  Award,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Mock conversations data for braiders - from client perspective
const mockBraiderConversations = [
  {
    id: "conv-1",
    participant: {
      id: "user-1",
      name: "Ana Costa",
      avatar: "/placeholder.svg?height=50&width=50&text=AC",
      role: "user",
      isOnline: true,
      lastSeen: "Online"
    },
    lastMessage: {
      content: "Olá! Gostaria de agendar um serviço de tranças nagô para este final de semana.",
      timestamp: "11:45",
      isRead: false,
      sender: "user-1"
    },
    unreadCount: 3
  },
  {
    id: "conv-2", 
    participant: {
      id: "user-2",
      name: "Maria Silva",
      avatar: "/placeholder.svg?height=50&width=50&text=MS",
      role: "user",
      isOnline: false,
      lastSeen: "Há 2 horas"
    },
    lastMessage: {
      content: "Obrigada! As tranças ficaram perfeitas. Recomendo você para minhas amigas! 😍",
      timestamp: "09:30",
      isRead: true,
      sender: "user-2"
    },
    unreadCount: 0
  },
  {
    id: "conv-3",
    participant: {
      id: "user-3",
      name: "Joana Santos",
      avatar: "/placeholder.svg?height=50&width=50&text=JS",
      role: "user",
      isOnline: true,
      lastSeen: "Online"
    },
    lastMessage: {
      content: "Posso remarcar o agendamento de amanhã para a próxima semana?",
      timestamp: "08:15",
      isRead: true,
      sender: "user-3"
    },
    unreadCount: 0
  },
  {
    id: "conv-4",
    participant: {
      id: "user-4",
      name: "Carla Mendes",
      avatar: "/placeholder.svg?height=50&width=50&text=CM",
      role: "user",
      isOnline: false,
      lastSeen: "Há 1 dia"
    },
    lastMessage: {
      content: "Qual o preço do serviço de tranças box braids?",
      timestamp: "Ontem",
      isRead: false,
      sender: "user-4"
    },
    unreadCount: 1
  }
]

const mockBraiderMessages = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-1",
    content: "Olá! Vi seu perfil e gostei muito do seu trabalho. Gostaria de agendar um serviço.",
    timestamp: "2024-01-20T09:00:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-2",
    conversationId: "conv-1", 
    senderId: "braider-current",
    content: "Oi Ana! Obrigada pelo interesse. Que tipo de tranças você gostaria de fazer?",
    timestamp: "2024-01-20T09:15:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    senderId: "user-1", 
    content: "Estou pensando em fazer tranças nagô. Quanto custa e quanto tempo demora?",
    timestamp: "2024-01-20T09:30:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    senderId: "braider-current",
    content: "As tranças nagô custam €45 e levam cerca de 3 horas. Posso fazer ao domicílio ou aqui no meu estúdio.",
    timestamp: "2024-01-20T09:45:00Z", 
    isRead: true,
    type: "text"
  },
  {
    id: "msg-5",
    conversationId: "conv-1",
    senderId: "user-1",
    content: "Perfeito! Prefiro ao domicílio. Você tem disponibilidade este final de semana?",
    timestamp: "2024-01-20T10:00:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-6",
    conversationId: "conv-1",
    senderId: "braider-current",
    content: "Tenho disponibilidade no sábado à tarde a partir das 14h. Te serve?",
    timestamp: "2024-01-20T10:15:00Z",
    isRead: false,
    type: "text"
  },
  {
    id: "msg-7",
    conversationId: "conv-1",
    senderId: "user-1",
    content: "Olá! Gostaria de agendar um serviço de tranças nagô para este final de semana.",
    timestamp: "2024-01-20T11:45:00Z",
    isRead: false,
    type: "text"
  }
]

type Conversation = typeof mockBraiderConversations[0]
type Message = typeof mockBraiderMessages[0]

export default function BraiderMessagesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [braider, setBraider] = useState<Braider | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>(mockBraiderConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>(mockBraiderMessages)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  // Get conversation ID from URL params
  const conversationId = searchParams.get('conversation')

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Get braider data - simulate braider-1 is logged in (same as layout pattern)
    const braiderData = getBraiderById("braider-1")
    if (!braiderData) {
      router.push("/register-braider")
      return
    }
    setBraider(braiderData)

    // Set selected conversation from URL params
    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setSelectedConversation(conversation)
      }
    } else if (conversations.length > 0) {
      // Default to first conversation if no specific one selected
      setSelectedConversation(conversations[0])
    }
  }, [user, router, conversationId, conversations])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setLoading(true)
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: "braider-current",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: "text"
    }

    setMessages(prev => [...prev, message])
    setNewMessage("")
    
    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? {
            ...conv,
            lastMessage: {
              content: newMessage,
              timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              isRead: false,
              sender: "braider-current"
            }
          }
        : conv
    ))

    // Simulate client response after delay
    setTimeout(() => {
      const responseMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        conversationId: selectedConversation.id,
        senderId: selectedConversation.participant.id,
        content: "Obrigada pela resposta! Vou confirmar e te aviso em breve.",
        timestamp: new Date().toISOString(),
        isRead: false,
        type: "text"
      }
      setMessages(prev => [...prev, responseMessage])
    }, 2000)

    setLoading(false)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const conversationMessages = messages.filter(m => 
    m.conversationId === selectedConversation?.id
  )

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!user || !braider) {
    return null
  }

  // Calculate stats
  const totalConversations = conversations.length
  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
  const todayMessages = messages.filter(m => {
    const messageDate = new Date(m.timestamp).toDateString()
    const today = new Date().toDateString()
    return messageDate === today
  }).length

  return (
    <BraiderDashboardContentWrapper>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-500 via-teal-600 to-blue-600 py-12 text-white relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Mensagens 💬
                </h1>
                <p className="text-white/90 text-lg">
                  Converse com seus clientes
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Responda dúvidas, confirme agendamentos e ofereça suporte
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">{totalConversations}</div>
                <div className="text-white/80 text-sm">Conversas</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">{unreadCount}</div>
                <div className="text-white/80 text-sm">Não Lidas</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">{todayMessages}</div>
                <div className="text-white/80 text-sm">Hoje</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-400px)]">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversas
                </CardTitle>
                <Button size="icon" variant="outline" className="rounded-xl">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100",
                        selectedConversation?.id === conversation.id ? "bg-green-50 border border-green-200" : ""
                      )}
                    >
                      <div className="relative">
                        <Image
                          src={conversation.participant.avatar}
                          alt={conversation.participant.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized={true}
                        />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                          conversation.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {conversation.participant.name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 truncate flex-1">
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-green-500 text-white text-xs ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          {selectedConversation ? (
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={selectedConversation.participant.avatar}
                        alt={selectedConversation.participant.name}
                        width={50}
                        height={50}
                        className="rounded-full object-cover"
                        unoptimized={true}
                      />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        selectedConversation.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {selectedConversation.participant.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.participant.isOnline ? "Online" : selectedConversation.participant.lastSeen}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="rounded-xl">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-xl">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-xl">
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-xl">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderId === "braider-current" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%] p-3 rounded-2xl",
                          message.senderId === "braider-current"
                            ? "bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            message.senderId === "braider-current" ? "text-green-100" : "text-gray-500"
                          )}>
                            <span>{formatTimestamp(message.timestamp)}</span>
                            {message.senderId === "braider-current" && (
                              message.isRead ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" className="rounded-xl shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-xl shrink-0">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-gray-200 pr-12"
                      rows={1}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione uma conversa</h3>
                <p className="text-gray-600">Escolha uma conversa da lista para responder seus clientes</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </BraiderDashboardContentWrapper>
  )
}