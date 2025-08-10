"use client"

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Search, 
  Send, 
  Phone,
  Video,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Plus,
  Loader2,
  MoreVertical,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRealtimeChat } from "@/hooks/useRealtimeChat"
import { useUserPresence } from "@/hooks/useUserPresence"
import { toast } from "react-hot-toast"
import MessageStatusIndicator from "./message-status-indicator"
import UserOnlineStatus from "./user-online-status"
import TypingIndicator from "./typing-indicator"
import AvatarWithInitials from "./avatar-with-initials"

interface RealtimeChatProps {
  className?: string
  showHeader?: boolean
  headerTitle?: string
  colorTheme?: 'blue' | 'green' | 'purple'
  onCreateConversation?: (participantId: string, message?: string) => void
}

export function RealtimeChat({ 
  className,
  showHeader = true,
  headerTitle = "Mensagens",
  colorTheme = 'blue',
  onCreateConversation
}: RealtimeChatProps) {
  const {
    conversations,
    loadingConversations,
    conversationsError,
    selectedConversation,
    setSelectedConversation,
    messages,
    loadingMessages,
    messagesError,
    hasMoreMessages,
    sendMessage,
    sendingMessage,
    loadMoreMessages,
    getMessageStatus,
    typingUsers,
    isConnected,
    refreshConversations,
    handleTyping,
    stopTyping
  } = useRealtimeChat()

  // Activate user presence system
  useUserPresence()

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme colors
  const themeColors = {
    blue: {
      primary: 'bg-blue-500',
      primaryHover: 'hover:bg-blue-600',
      secondary: 'bg-blue-50',
      accent: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      primary: 'bg-green-500',
      primaryHover: 'hover:bg-green-600',
      secondary: 'bg-green-50',
      accent: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      primary: 'bg-purple-500',
      primaryHover: 'hover:bg-purple-600',
      secondary: 'bg-purple-50',
      accent: 'text-purple-600',
      border: 'border-purple-200'
    }
  }

  const theme = themeColors[colorTheme]

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement?.parentElement
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    // Only scroll if user is near bottom to avoid interrupting reading
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages])

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !selectedConversation) return

    // Stop typing indicator when sending message
    stopTyping()

    const success = await sendMessage(newMessage.trim())
    if (success) {
      setNewMessage("")
    } else {
      toast.error("Erro ao enviar mensagem")
    }
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle text area change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Trigger typing indicator when user types
    if (e.target.value.trim()) {
      handleTyping()
    } else {
      stopTyping()
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Handle conversation selection
  const handleConversationSelect = (conversation: typeof conversations[0]) => {
    setSelectedConversation(conversation)
  }

  if (loadingConversations) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    )
  }

  if (conversationsError) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">{conversationsError}</p>
          <Button onClick={refreshConversations} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-5 gap-6 h-auto lg:h-[calc(100vh-200px)] lg:min-h-[600px]", className)}>
      {/* Conversations Sidebar */}
      <div className="lg:col-span-2 h-full lg:h-auto">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-[350px] lg:h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {showHeader && headerTitle}
                {!isConnected && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Desconectado" />
                )}
                {isConnected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Conectado" />
                )}
              </CardTitle>
              {onCreateConversation && (
                <Button size="icon" variant="outline" className="rounded-xl">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
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
              <div className="space-y-3 p-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500 text-sm">
                      {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100",
                        selectedConversation?.id === conversation.id ? `${theme.secondary} ${theme.border} border` : ""
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <AvatarWithInitials
                          name={conversation.participant.name}
                          avatarUrl={conversation.participant.avatar}
                          size="sm"
                          className="w-12 h-12"
                        />
                        <div className="absolute -bottom-1 -right-1">
                          <UserOnlineStatus userId={conversation.participant.id} size="sm" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base text-gray-900 truncate leading-tight">
                              {conversation.participant.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                conversation.participant.isOnline ? "bg-green-500" : "bg-gray-400"
                              )} />
                              <span className="text-sm text-gray-500 truncate">
                                {conversation.participant.isOnline ? "Online" : conversation.participant.lastSeen}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {conversation.lastMessage.timestamp}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <Badge className={`${theme.primary} text-white text-xs h-5 min-w-[20px] flex items-center justify-center`}>
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="w-full mt-2">
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 break-words">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 h-full">
        {selectedConversation ? (
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-[450px] lg:h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <AvatarWithInitials
                      name={selectedConversation.participant.name}
                      avatarUrl={selectedConversation.participant.avatar}
                      size="sm"
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {selectedConversation.participant.name}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <UserOnlineStatus 
                        userId={selectedConversation.participant.id} 
                        showLabel={true} 
                        size="sm" 
                      />
                    </div>
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
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-y-auto p-4" style={{ maxHeight: '400px' }}>
                <div className="space-y-3">
                  {loadingMessages && messages.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-gray-600">Carregando mensagens...</span>
                    </div>
                  )}
                  
                  {messagesError && (
                    <div className="flex items-center justify-center py-8">
                      <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                      <span className="text-red-600">{messagesError}</span>
                    </div>
                  )}

                  {hasMoreMessages && (
                    <div className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={loadMoreMessages}
                        disabled={loadingMessages}
                        className="text-gray-600"
                      >
                        {loadingMessages ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Carregar mensagens anteriores
                      </Button>
                    </div>
                  )}
                  
                  {messages.map((message) => {
                    const isOwnMessage = message.sender.id !== selectedConversation.participant.id
                    const messageStatus = getMessageStatus(message.id)
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 mb-2",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        {/* Avatar for other user */}
                        {!isOwnMessage && (
                          <div className="flex-shrink-0 mr-3">
                            <AvatarWithInitials
                              name={message.sender.name}
                              avatarUrl={message.sender.avatar}
                              size="sm"
                              className="w-5 h-5"
                            />
                          </div>
                        )}
                        
                        <div className={cn(
                          "max-w-[70%] flex flex-col",
                          isOwnMessage ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-3 py-2 rounded-2xl",
                            isOwnMessage
                              ? `${theme.primary} text-white rounded-br-md`
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          )}>
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          </div>
                          
                          {/* Timestamp and status outside bubble */}
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs px-1",
                            isOwnMessage ? "text-gray-500" : "text-gray-400"
                          )}>
                            <span>{formatTimestamp(message.timestamp)}</span>
                            
                            {/* Message status for own messages */}
                            <MessageStatusIndicator 
                              status={messageStatus} 
                              isOwn={isOwnMessage}
                              className="ml-1" 
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <TypingIndicator 
                      userName={selectedConversation.participant.name} 
                      className="mb-2"
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    // TODO: Handle file upload
                    console.log('File selected:', e.target.files?.[0])
                  }}
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="rounded-xl shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-xl shrink-0">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
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
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`${theme.primary} ${theme.primaryHover} text-white rounded-xl shrink-0`}
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 h-[450px] lg:h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione uma conversa</h3>
              <p className="text-gray-600">Escolha uma conversa da lista para começar a chatear</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}