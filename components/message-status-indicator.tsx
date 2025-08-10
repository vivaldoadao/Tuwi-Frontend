"use client"

import { Check, CheckCheck, Clock } from "lucide-react"

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
  if (!isOwn) return null
  
  // Always show at least 'sent' status for own messages
  const effectiveStatus = status || 'sent'

  const getStatusIcon = () => {
    switch (effectiveStatus) {
      case 'sending':
        return <Clock className="h-3 w-3 animate-pulse text-gray-400" />
      
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-500" />
      
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      
      default:
        // Fallback: show 'sent' status if no status provided but is own message
        return <Check className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {getStatusIcon()}
    </div>
  )
}