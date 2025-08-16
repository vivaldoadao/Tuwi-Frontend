'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { StarDisplay } from './star-rating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, 
  MessageCircle, 
  Flag, 
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ImageIcon,
  ThumbsUp,
  Reply,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Rating {
  id: string
  overall_rating: number
  quality_rating?: number
  punctuality_rating?: number
  communication_rating?: number
  professionalism_rating?: number
  review_title?: string
  review_text?: string
  client_name: string
  review_images?: string[]
  is_verified: boolean
  braider_response?: string
  braider_response_date?: string
  created_at: string
  services?: {
    id: string
    name: string
    price: number
  }
  bookings?: {
    id: string
    booking_date: string
    booking_time: string
  }
}

interface RatingCardProps {
  rating: Rating
  currentUserId?: string
  userRole?: 'customer' | 'braider' | 'admin'
  braiderId?: string
  onEdit?: (ratingId: string) => void
  onDelete?: (ratingId: string) => Promise<void>
  onReport?: (ratingId: string, reason: string, description: string) => Promise<void>
  onRespond?: (ratingId: string, response: string) => Promise<void>
  showBraiderActions?: boolean
  className?: string
}

export function RatingCard({
  rating,
  currentUserId,
  userRole,
  braiderId,
  onEdit,
  onDelete,
  onReport,
  onRespond,
  showBraiderActions = false,
  className
}: RatingCardProps) {
  const { toast } = useToast()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)

  // Verificar se é dono da avaliação
  const isOwner = currentUserId === rating.client_name // Simplificado - em produção usar client_id
  const isBraider = userRole === 'braider' && showBraiderActions
  const isAdmin = userRole === 'admin'
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner || isAdmin
  const canRespond = isBraider && !rating.braider_response

  const handleDelete = async () => {
    if (!onDelete) return

    setLoading(true)
    try {
      await onDelete(rating.id)
      setShowDeleteDialog(false)
      toast({
        title: "Avaliação removida",
        description: "A avaliação foi removida com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a avaliação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async (reason: string, description: string) => {
    if (!onReport) return

    setLoading(true)
    try {
      await onReport(rating.id, reason, description)
      setShowReportDialog(false)
      toast({
        title: "Denúncia enviada",
        description: "Obrigada pela sua denúncia. Analisaremos em breve."
      })
    } catch (error) {
      toast({
        title: "Erro ao denunciar",
        description: "Não foi possível enviar a denúncia",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async () => {
    if (!onRespond || !responseText.trim()) return

    setLoading(true)
    try {
      await onRespond(rating.id, responseText.trim())
      setShowResponseForm(false)
      setResponseText('')
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi publicada com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro ao responder",
        description: "Não foi possível enviar a resposta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const hasDetailedRatings = !!(
    rating.quality_rating || 
    rating.punctuality_rating || 
    rating.communication_rating || 
    rating.professionalism_rating
  )

  return (
    <>
      <Card className={className}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {getInitials(rating.client_name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rating.client_name}</span>
                  {rating.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(rating.created_at), { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                  
                  {rating.services && (
                    <>
                      <span>•</span>
                      <span>{rating.services.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions menu */}
            {(canEdit || canDelete || canRespond || !isOwner) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit?.(rating.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  
                  {canRespond && (
                    <DropdownMenuItem onClick={() => setShowResponseForm(true)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Responder
                    </DropdownMenuItem>
                  )}
                  
                  {(canEdit || canDelete) && <DropdownMenuSeparator />}
                  
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  )}
                  
                  {!isOwner && !isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                        <Flag className="w-4 h-4 mr-2" />
                        Denunciar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Rating */}
          <div className="mb-4">
            <StarDisplay 
              rating={rating.overall_rating}
              size="md"
              showValue
              className="mb-2"
            />
            
            {/* Detailed ratings */}
            {hasDetailedRatings && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                {rating.quality_rating && (
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                    <StarDisplay rating={rating.quality_rating} size="sm" />
                    <span className="text-xs text-gray-600 mt-1">Qualidade</span>
                  </div>
                )}
                
                {rating.punctuality_rating && (
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                    <StarDisplay rating={rating.punctuality_rating} size="sm" />
                    <span className="text-xs text-gray-600 mt-1">Pontualidade</span>
                  </div>
                )}
                
                {rating.communication_rating && (
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                    <StarDisplay rating={rating.communication_rating} size="sm" />
                    <span className="text-xs text-gray-600 mt-1">Comunicação</span>
                  </div>
                )}
                
                {rating.professionalism_rating && (
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                    <StarDisplay rating={rating.professionalism_rating} size="sm" />
                    <span className="text-xs text-gray-600 mt-1">Profissionalismo</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title and review */}
          {rating.review_title && (
            <h3 className="font-medium text-gray-900 mb-2">
              {rating.review_title}
            </h3>
          )}
          
          {rating.review_text && (
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {rating.review_text}
            </p>
          )}

          {/* Images */}
          {rating.review_images && rating.review_images.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {rating.review_images.map((image, index) => (
                <div key={index} className="flex-shrink-0">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Braider response */}
          {rating.braider_response && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Resposta da trancista</span>
                <span className="text-sm text-blue-600">
                  {rating.braider_response_date && 
                    formatDistanceToNow(new Date(rating.braider_response_date), { 
                      addSuffix: true,
                      locale: ptBR 
                    })
                  }
                </span>
              </div>
              <p className="text-blue-800 whitespace-pre-wrap">
                {rating.braider_response}
              </p>
            </div>
          )}

          {/* Response form */}
          {showResponseForm && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Responder avaliação</h4>
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleRespond}
                    disabled={loading || !responseText.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowResponseForm(false)}
                    size="sm"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}