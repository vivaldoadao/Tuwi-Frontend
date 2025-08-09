"use client"

import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react"

interface MessageStatusIndicatorProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | null
  isOwn?: boolean
  className?: string
}

export default function MessageStatusIndicator({ 
  status, 
  isOwn = false, 
  className = "" 
}: MessageStatusIndicatorProps) {
  if (!isOwn || !status) return null

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock className="h-3 w-3 animate-pulse" />
            <span>Enviando...</span>
          </div>
        )
      
      case 'sent':
        return (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Check className="h-3 w-3" />
            <span>Enviada</span>
          </div>
        )
      
      case 'delivered':
        return (
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <CheckCheck className="h-3 w-3" />
            <span>Entregue</span>
          </div>
        )
      
      case 'read':
        return (
          <div className="flex items-center gap-1 text-blue-500 text-xs">
            <CheckCheck className="h-3 w-3" />
            <span>Lida</span>
          </div>
        )
      
      default:
        return (
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>Erro</span>
          </div>
        )
    }
  }

  return (
    <div className={`flex items-center justify-end mt-1 ${className}`}>
      {getStatusIcon()}
    </div>
  )
}