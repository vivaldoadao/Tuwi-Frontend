'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from './star-rating'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, Send, User } from 'lucide-react'

interface RatingFormProps {
  braiderId: string
  braiderName: string
  bookingId?: string
  serviceId?: string
  onSubmit: (ratingData: any) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

interface RatingData {
  overallRating: number
  qualityRating?: number
  punctualityRating?: number
  communicationRating?: number
  professionalismRating?: number
  reviewTitle?: string
  reviewText?: string
  clientName: string
  clientEmail: string
  reviewImages?: string[]
}

export function RatingForm({
  braiderId,
  braiderName,
  bookingId,
  serviceId,
  onSubmit,
  onCancel,
  loading = false
}: RatingFormProps) {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<RatingData>({
    overallRating: 0,
    qualityRating: undefined,
    punctualityRating: undefined,
    communicationRating: undefined,
    professionalismRating: undefined,
    reviewTitle: '',
    reviewText: '',
    clientName: '',
    clientEmail: '',
    reviewImages: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDetailedRatings, setShowDetailedRatings] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.overallRating === 0) {
      newErrors.overallRating = 'Avaliação geral é obrigatória'
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Nome é obrigatório'
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erro na validação",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        braiderId,
        bookingId,
        serviceId,
        overallRating: formData.overallRating,
        qualityRating: formData.qualityRating,
        punctualityRating: formData.punctualityRating,
        communicationRating: formData.communicationRating,
        professionalismRating: formData.professionalismRating,
        reviewTitle: formData.reviewTitle,
        reviewText: formData.reviewText,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        reviewImages: formData.reviewImages
      })

      // Success feedback
      toast({
        title: "✅ Avaliação enviada!",
        description: "Obrigada pelo seu feedback. A avaliação foi publicada com sucesso.",
      })

      // Reset form
      setFormData({
        overallRating: 0,
        qualityRating: undefined,
        punctualityRating: undefined,
        communicationRating: undefined,
        professionalismRating: undefined,
        reviewTitle: '',
        reviewText: '',
        clientName: '',
        clientEmail: '',
        reviewImages: []
      })

      // Auto-close modal after success
      setTimeout(() => {
        onCancel?.()
      }, 1500)

    } catch (error) {
      console.error('Error submitting rating:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      toast({
        title: "❌ Erro ao enviar avaliação",
        description: `${errorMessage}. Tente novamente em alguns instantes.`,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof RatingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto relative">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600 font-medium">Enviando sua avaliação...</p>
          </div>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Avaliar {braiderName}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Sua opinião é muito importante para nossa comunidade
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informações do cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Seu nome *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => updateFormData('clientName', e.target.value)}
                placeholder="Como você gostaria de aparecer"
                className={errors.clientName ? 'border-red-500' : ''}
              />
              {errors.clientName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clientName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Seu email *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => updateFormData('clientEmail', e.target.value)}
                placeholder="seu@email.com"
                className={errors.clientEmail ? 'border-red-500' : ''}
              />
              {errors.clientEmail && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clientEmail}
                </p>
              )}
            </div>
          </div>

          {/* Avaliação geral */}
          <div className="space-y-2">
            <Label>Avaliação geral *</Label>
            <div className="flex items-center gap-4">
              <StarRating
                rating={formData.overallRating}
                onRatingChange={(rating) => updateFormData('overallRating', rating)}
                size="lg"
                showValue
              />
              {formData.overallRating > 0 && (
                <span className="text-sm text-gray-600">
                  {formData.overallRating === 1 && "Muito ruim"}
                  {formData.overallRating === 2 && "Ruim"}
                  {formData.overallRating === 3 && "Regular"}
                  {formData.overallRating === 4 && "Bom"}
                  {formData.overallRating === 5 && "Excelente"}
                </span>
              )}
            </div>
            {errors.overallRating && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.overallRating}
              </p>
            )}
          </div>

          {/* Toggle para avaliações detalhadas */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedRatings(!showDetailedRatings)}
            >
              {showDetailedRatings ? 'Ocultar' : 'Mostrar'} avaliação detalhada
            </Button>
          </div>

          {/* Avaliações por categoria */}
          {showDetailedRatings && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Avaliação detalhada</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qualidade do trabalho</Label>
                  <StarRating
                    rating={formData.qualityRating || 0}
                    onRatingChange={(rating) => updateFormData('qualityRating', rating)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pontualidade</Label>
                  <StarRating
                    rating={formData.punctualityRating || 0}
                    onRatingChange={(rating) => updateFormData('punctualityRating', rating)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comunicação</Label>
                  <StarRating
                    rating={formData.communicationRating || 0}
                    onRatingChange={(rating) => updateFormData('communicationRating', rating)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profissionalismo</Label>
                  <StarRating
                    rating={formData.professionalismRating || 0}
                    onRatingChange={(rating) => updateFormData('professionalismRating', rating)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Título do review */}
          <div className="space-y-2">
            <Label htmlFor="reviewTitle">Título da avaliação</Label>
            <Input
              id="reviewTitle"
              value={formData.reviewTitle}
              onChange={(e) => updateFormData('reviewTitle', e.target.value)}
              placeholder="Resuma sua experiência em poucas palavras"
              maxLength={200}
            />
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="reviewText">Comentário</Label>
            <Textarea
              id="reviewText"
              value={formData.reviewText}
              onChange={(e) => updateFormData('reviewText', e.target.value)}
              placeholder="Conte mais sobre sua experiência com esta trancista..."
              rows={4}
            />
          </div>

          {/* Upload de imagens */}
          <div className="space-y-2">
            <Label>Fotos do resultado (opcional)</Label>
            <ImageUpload
              onImagesChange={(images) => updateFormData('reviewImages', images)}
              maxImages={3}
              accept="image/*"
            />
            <p className="text-xs text-gray-500">
              Máximo de 3 imagens. Formatos aceitos: JPG, PNG, WEBP
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || formData.overallRating === 0}
              className="flex-1 relative"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando avaliação...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6"
              >
                {isSubmitting ? 'Aguarde...' : 'Cancelar'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}