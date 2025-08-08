"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Clock, Euro, Star, Users, Calendar } from "lucide-react"
import type { Service } from "@/lib/data-supabase"

interface ServiceDetailModalProps {
  service: Service | null
  braiderName?: string
  braiderRating?: number
  braiderReviews?: number
  isOpen: boolean
  onClose: () => void
  onSelectService: (serviceId: string) => void
}

export default function ServiceDetailModal({
  service,
  braiderName,
  braiderRating = 4.8,
  braiderReviews = 156,
  isOpen,
  onClose,
  onSelectService
}: ServiceDetailModalProps) {
  if (!service) return null

  const handleSelectService = () => {
    onSelectService(service.id)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading">
            {service.name}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Detalhes completos do serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Image */}
          {service.imageUrl && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={service.imageUrl}
                alt={service.name}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          )}

          {/* Service Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description || "Serviço profissional de alta qualidade com técnicas especializadas."}
                </p>
              </div>

              {/* Service Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duração</div>
                    <div className="font-semibold text-gray-900">
                      {service.durationMinutes} minutos
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Euro className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Preço</div>
                    <div className="font-bold text-2xl text-green-600">
                      €{service.price.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Braider Info */}
              {braiderName && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trancista</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-accent-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{braiderName}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(braiderRating) 
                                ? 'fill-accent-500 text-accent-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">
                          {braiderRating} ({braiderReviews} avaliações)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Características</h3>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-accent-700 border-accent-200 bg-accent-50">
                    ✨ Técnica Profissional
                  </Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                    🔧 Produtos de Qualidade
                  </Badge>
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                    ⏱️ Atendimento Pontual
                  </Badge>
                  <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                    💯 Satisfação Garantida
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="bg-accent-50 border border-accent-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent-600" />
              <div>
                <div className="font-semibold text-accent-900">Tempo Estimado</div>
                <div className="text-sm text-accent-700">
                  Este serviço tem duração aproximada de {service.durationMinutes} minutos. 
                  O tempo pode variar ligeiramente dependendo do tipo e tamanho do cabelo.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={handleSelectService}
              className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Escolher Este Serviço
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}