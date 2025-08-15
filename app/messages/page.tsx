"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"
import { getAllBraiders, type Braider } from "@/lib/data"
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
  Plus
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Mock messages data
const mockConversations = [
  {
    id: "conv-1",
    participant: {
      id: "braider-1",
      name: "Sofia Santos",
      avatar: "/placeholder.svg?height=50&width=50&text=SS",
      role: "braider",
      isOnline: true,
      lastSeen: "Online"
    },
    lastMessage: {
      content: "Olá! Posso ajudar com informações sobre os serviços de tranças.",
      timestamp: "10:30",
      isRead: false,
      sender: "braider-1"
    },
    unreadCount: 2
  },
  {
    id: "conv-2", 
    participant: {
      id: "braider-2",
      name: "Maria Silva",
      avatar: "/placeholder.svg?height=50&width=50&text=MS",
      role: "braider",
      isOnline: false,
      lastSeen: "Há 1 hora"
    },
    lastMessage: {
      content: "Perfeito! Vou confirmar o agendamento para amanhã às 14h.",
      timestamp: "09:15",
      isRead: true,
      sender: "braider-2"
    },
    unreadCount: 0
  },
  {
    id: "conv-3",
    participant: {
      id: "user-1",
      name: "Ana Costa",
      avatar: "/placeholder.svg?height=50&width=50&text=AC",
      role: "user",
      isOnline: true,
      lastSeen: "Online"
    },
    lastMessage: {
      content: "Obrigada pelas dicas! Ficaram lindas as tranças 😍",
      timestamp: "08:45",
      isRead: true,
      sender: "user-1"
    },
    unreadCount: 0
  }
]

const mockMessages = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "braider-1",
    content: "Olá! Vi que você tem interesse nos meus serviços de tranças. Como posso ajudar?",
    timestamp: "2024-01-20T09:00:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-2",
    conversationId: "conv-1", 
    senderId: "user-current",
    content: "Oi Sofia! Gostaria de saber mais sobre o serviço de tranças nagô. Qual o valor e duração?",
    timestamp: "2024-01-20T09:15:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    senderId: "braider-1", 
    content: "As tranças nagô custam €45 e levam aproximadamente 3 horas para fazer. Posso fazer ao domicílio ou você pode vir até mim.",
    timestamp: "2024-01-20T09:30:00Z",
    isRead: true,
    type: "text"
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    senderId: "user-current",
    content: "Perfeito! Prefiro ao domicílio. Você tem disponibilidade este final de semana?",
    timestamp: "2024-01-20T09:45:00Z", 
    isRead: true,
    type: "text"
  },
  {
    id: "msg-5",
    conversationId: "conv-1",
    senderId: "braider-1",
    content: "Tenho sim! Posso no sábado à tarde ou domingo de manhã. Qual prefere?",
    timestamp: "2024-01-20T10:00:00Z",
    isRead: false,
    type: "text"
  },
  {
    id: "msg-6",
    conversationId: "conv-1",
    senderId: "braider-1",
    content: "Olá! Posso ajudar com informações sobre os serviços de tranças.",
    timestamp: "2024-01-20T10:30:00Z",
    isRead: false,
    type: "text"
  }
]

type Conversation = typeof mockConversations[0]
type Message = typeof mockMessages[0]

function MessagesContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  // Get conversation ID from URL params
  const conversationId = searchParams?.get('conversation')

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

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
      senderId: "user-current",
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
              sender: "user-current"
            }
          }
        : conv
    ))

    // Simulate response after delay
    setTimeout(() => {
      const responseMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        conversationId: selectedConversation.id,
        senderId: selectedConversation.participant.id,
        content: "Obrigada pela mensagem! Vou responder em breve.",
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

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 py-12 text-white relative overflow-hidden">
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
                  Converse com trancistas e clientes
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Tire dúvidas, agende serviços e mantenha contato
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{conversations.length}</div>
              <div className="text-white/80 font-medium">Conversas</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
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
                      placeholder="Pesquisar conversas..."
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
                            selectedConversation?.id === conversation.id ? "bg-blue-50 border border-blue-200" : ""
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
                                <Badge className="bg-blue-500 text-white text-xs ml-2">
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
                              message.senderId === "user-current" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[70%] p-3 rounded-2xl",
                              message.senderId === "user-current"
                                ? "bg-blue-500 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                            )}>
                              <p className="text-sm">{message.content}</p>
                              <div className={cn(
                                "flex items-center gap-1 mt-1 text-xs",
                                message.senderId === "user-current" ? "text-blue-100" : "text-gray-500"
                              )}>
                                <span>{formatTimestamp(message.timestamp)}</span>
                                {message.senderId === "user-current" && (
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
                          placeholder="Digite sua mensagem..."
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
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shrink-0"
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
                    <p className="text-gray-600">Escolha uma conversa da lista para começar a chatear</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-brand-primary text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-brand-accent">WILNARA TRANÇAS</span>
          </div>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}