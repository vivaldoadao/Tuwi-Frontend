"use client"

import { useNotifications, type Toast } from "@/context/notifications-context-v2"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, ShoppingBag, MessageSquare, Calendar, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const getToastIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />
    case 'order':
      return <ShoppingBag className="h-5 w-5 text-purple-600" />
    case 'message':
      return <MessageSquare className="h-5 w-5 text-indigo-600" />
    case 'booking':
      return <Calendar className="h-5 w-5 text-teal-600" />
    case 'system':
      return <Settings className="h-5 w-5 text-gray-600" />
    default:
      return <Info className="h-5 w-5 text-blue-600" />
  }
}

const getToastStyles = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return "bg-green-50 border-green-200 text-green-900"
    case 'error':
      return "bg-red-50 border-red-200 text-red-900"
    case 'warning':
      return "bg-yellow-50 border-yellow-200 text-yellow-900"
    case 'info':
      return "bg-blue-50 border-blue-200 text-blue-900"
    case 'order':
      return "bg-purple-50 border-purple-200 text-purple-900"
    case 'message':
      return "bg-indigo-50 border-indigo-200 text-indigo-900"
    case 'booking':
      return "bg-teal-50 border-teal-200 text-teal-900"
    case 'system':
      return "bg-gray-50 border-gray-200 text-gray-900"
    default:
      return "bg-blue-50 border-blue-200 text-blue-900"
  }
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useNotifications()

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-105",
        getToastStyles(toast.type),
        "animate-in slide-in-from-right-full"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getToastIcon(toast.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1 line-clamp-1">
          {toast.title}
        </h4>
        <p className="text-sm opacity-90 line-clamp-2">
          {toast.message}
        </p>
        
        {toast.action && (
          <Button
            onClick={toast.action.onClick}
            variant="ghost"
            size="sm"
            className="mt-2 h-auto p-1 text-xs underline"
          >
            {toast.action.label}
          </Button>
        )}
      </div>
      
      <Button
        onClick={() => dismissToast(toast.id)}
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/10"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useNotifications()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}