"use client"

import { 
  Package, 
  MapPin, 
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  Play
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TrackingEvent } from "@/lib/data-supabase"

interface OrderTimelineProps {
  events: TrackingEvent[]
  className?: string
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'order_created':
      return ShoppingBag
    case 'payment_confirmed':
      return CreditCard
    case 'processing_started':
      return Play
    case 'shipped':
      return Truck
    case 'out_for_delivery':
      return Truck
    case 'delivered':
      return CheckCircle
    case 'cancelled':
      return AlertCircle
    case 'returned':
      return Package
    case 'refunded':
      return CreditCard
    case 'note_added':
      return Package
    default:
      return Clock
  }
}

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'order_created':
      return 'text-blue-600 bg-blue-100 border-blue-200'
    case 'payment_confirmed':
      return 'text-green-600 bg-green-100 border-green-200'
    case 'processing_started':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    case 'shipped':
      return 'text-purple-600 bg-purple-100 border-purple-200'
    case 'out_for_delivery':
      return 'text-orange-600 bg-orange-100 border-orange-200'
    case 'delivered':
      return 'text-green-600 bg-green-100 border-green-200'
    case 'cancelled':
      return 'text-red-600 bg-red-100 border-red-200'
    case 'returned':
      return 'text-gray-600 bg-gray-100 border-gray-200'
    case 'refunded':
      return 'text-indigo-600 bg-indigo-100 border-indigo-200'
    case 'note_added':
      return 'text-gray-600 bg-gray-100 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200'
  }
}

const getEventStatus = (eventType: string) => {
  switch (eventType) {
    case 'order_created':
      return 'Criado'
    case 'payment_confirmed':
      return 'Pago'
    case 'processing_started':
      return 'Processando'
    case 'shipped':
      return 'Enviado'
    case 'out_for_delivery':
      return 'Saiu para entrega'
    case 'delivered':
      return 'Entregue'
    case 'cancelled':
      return 'Cancelado'
    case 'returned':
      return 'Devolvido'
    case 'refunded':
      return 'Reembolsado'
    case 'note_added':
      return 'Atualização'
    default:
      return 'Evento'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function OrderTimeline({ events, className = "" }: OrderTimelineProps) {
  if (events.length === 0) {
    return (
      <Card className={`bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            Histórico do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento de rastreamento encontrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-primary" />
          Histórico do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => {
            const EventIcon = getEventIcon(event.eventType)
            const isLast = index === events.length - 1
            const isFirst = index === 0
            const colorClasses = getEventColor(event.eventType)
            
            return (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-200" />
                )}
                
                {/* Timeline point and content */}
                <div className="flex items-start gap-4">
                  {/* Icon circle */}
                  <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClasses} shadow-sm ${isFirst ? 'ring-4 ring-blue-200 ring-opacity-50' : ''}`}>
                    <EventIcon className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-6">
                    {/* Event header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getEventStatus(event.eventType)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Created by indicator */}
                      {event.createdBy && event.createdBy !== 'system' && (
                        <Badge variant="outline" className="text-xs">
                          {event.createdBy === 'admin' ? 'Admin' : event.createdBy}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Event description */}
                    {event.description && (
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    
                    {/* Additional info */}
                    <div className="space-y-2">
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.trackingNumber && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 mb-1">
                            Código de rastreamento:
                          </p>
                          <p className="font-mono text-sm text-blue-800 break-all">
                            {event.trackingNumber}
                          </p>
                        </div>
                      )}
                      
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Informações adicionais:
                          </p>
                          <div className="space-y-1">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key} className="text-sm text-gray-600">
                                <span className="font-medium capitalize">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}