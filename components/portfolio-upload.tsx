"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Move,
  Star,
  Eye
} from "lucide-react"
import Image from "next/image"
import { uploadPortfolioImage, validatePortfolioFile, PORTFOLIO_CONFIG } from "@/lib/supabase-storage"
import { cn } from "@/lib/utils"

interface PortfolioUploadProps {
  userId: string
  braiderId?: string
  initialImages?: string[]
  maxImages?: number
  onImagesChange?: (images: string[]) => void
  readonly?: boolean
  className?: string
}

interface ImageItem {
  id: string
  url: string
  isLocal: boolean
  file?: File
  uploading?: boolean
  position: number
}

export function PortfolioUpload({ 
  userId,
  braiderId,
  initialImages = [],
  maxImages = PORTFOLIO_CONFIG.MAX_IMAGES,
  onImagesChange,
  readonly = false,
  className
}: PortfolioUploadProps) {
  const [images, setImages] = useState<ImageItem[]>(() => 
    initialImages.map((url, index) => ({
      id: `existing-${index}`,
      url,
      isLocal: false,
      position: index
    }))
  )
  const [dragActive, setDragActive] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Notify parent of changes
  const notifyChange = useCallback((updatedImages: ImageItem[]) => {
    const urls = updatedImages
      .sort((a, b) => a.position - b.position)
      .map(img => img.url)
    onImagesChange?.(urls)
  }, [onImagesChange])

  // Handle file selection
  const handleFileSelect = useCallback(async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0 || readonly) return

    const fileArray = Array.from(newFiles)
    const remainingSlots = maxImages - images.length
    
    if (fileArray.length > remainingSlots) {
      toast.error(`Máximo ${maxImages} imagens permitidas. Você pode adicionar apenas ${remainingSlots} mais.`)
      return
    }

    // Create local image items for immediate preview
    const newImages: ImageItem[] = []
    
    for (const file of fileArray) {
      // Validate file
      const validation = validatePortfolioFile(file, { userId })
      if (!validation.valid) {
        toast.error(validation.error!)
        continue
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      const newImage: ImageItem = {
        id: `local-${Date.now()}-${Math.random()}`,
        url: preview,
        isLocal: true,
        file,
        uploading: false,
        position: images.length + newImages.length
      }
      
      newImages.push(newImage)
    }

    if (newImages.length === 0) return

    // Update state with new images
    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    notifyChange(updatedImages)

    // Upload files if braiderId is provided (edit mode)
    if (braiderId) {
      for (const imageItem of newImages) {
        if (!imageItem.file) continue

        // Set uploading state
        setImages(prev => 
          prev.map(img => 
            img.id === imageItem.id 
              ? { ...img, uploading: true }
              : img
          )
        )

        try {
          // Upload to server
          const formData = new FormData()
          formData.append('image', imageItem.file)
          formData.append('braiderId', braiderId)
          formData.append('imagePosition', imageItem.position.toString())

          const response = await fetch('/api/braiders/portfolio/upload', {
            method: 'POST',
            body: formData
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Erro no upload')
          }

          // Update with server URL
          setImages(prev => 
            prev.map(img => 
              img.id === imageItem.id 
                ? { 
                    ...img, 
                    url: result.data.imageUrl,
                    isLocal: false,
                    uploading: false,
                    file: undefined
                  }
                : img
            )
          )

          toast.success('Imagem adicionada ao portfólio!')

        } catch (error) {
          console.error('Upload error:', error)
          toast.error(error instanceof Error ? error.message : 'Erro no upload')
          
          // Remove failed upload
          setImages(prev => prev.filter(img => img.id !== imageItem.id))
        }
      }
    } else {
      toast.success(`${newImages.length} imagem(ns) selecionada(s)!`)
    }
  }, [images, maxImages, userId, braiderId, readonly, notifyChange])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  // Handle image removal
  const handleRemoveImage = async (imageId: string) => {
    if (readonly) return

    const imageToRemove = images.find(img => img.id === imageId)
    if (!imageToRemove) return

    // Remove from state immediately
    const updatedImages = images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, position: index }))
    
    setImages(updatedImages)
    notifyChange(updatedImages)

    // Clean up blob URL if local
    if (imageToRemove.isLocal && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url)
    }

    // Remove from server if it was uploaded
    if (braiderId && !imageToRemove.isLocal) {
      try {
        const response = await fetch(
          `/api/braiders/portfolio/upload?braiderId=${braiderId}&imageUrl=${encodeURIComponent(imageToRemove.url)}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Erro ao remover imagem')
        }

        toast.success('Imagem removida do portfólio!')

      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao remover imagem')
      }
    } else {
      toast.success('Imagem removida')
    }
  }

  // Handle drag to reorder
  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    if (readonly) return
    setDraggedItem(imageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverImage = (e: React.DragEvent) => {
    if (readonly) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnImage = (e: React.DragEvent, targetImageId: string) => {
    if (readonly) return
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetImageId) {
      setDraggedItem(null)
      return
    }

    const draggedIndex = images.findIndex(img => img.id === draggedItem)
    const targetIndex = images.findIndex(img => img.id === targetImageId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      return
    }

    // Reorder images
    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(targetIndex, 0, draggedImage)

    // Update positions
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      position: index
    }))

    setImages(updatedImages)
    notifyChange(updatedImages)
    setDraggedItem(null)
    
    toast.success('Ordem das imagens atualizada!')
  }

  // File input click handler
  const handleFileInputClick = () => {
    if (readonly) return
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          Portfólio de Imagens
        </Label>
        <Badge variant="outline" className="text-xs">
          {images.length}/{maxImages}
        </Badge>
      </div>

      {/* Upload Area */}
      {!readonly && images.length < maxImages && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer",
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleFileInputClick}
        >
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste e solte imagens aqui ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500 mb-4">
              JPG, PNG, WebP ou GIF (máx. 5MB cada)
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Imagens
            </Button>
          </div>
          
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images
            .sort((a, b) => a.position - b.position)
            .map((image, index) => (
            <Card 
              key={image.id}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 transition-all duration-200",
                draggedItem === image.id ? "opacity-50 scale-95" : "opacity-100 scale-100",
                !readonly && "cursor-move hover:shadow-lg"
              )}
              draggable={!readonly}
              onDragStart={(e) => handleDragStart(e, image.id)}
              onDragOver={handleDragOverImage}
              onDrop={(e) => handleDropOnImage(e, image.id)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={image.url}
                    alt={`Portfólio ${index + 1}`}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-200",
                      !readonly && "group-hover:scale-105"
                    )}
                    unoptimized={image.isLocal}
                  />
                  
                  {/* Loading overlay */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Image controls */}
                  {!readonly && !image.uploading && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Add preview functionality here
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage(image.id)
                        }}
                        className="rounded-full w-8 h-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Position badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1"
                  >
                    {index + 1}
                  </Badge>

                  {/* Primary image badge */}
                  {index === 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Principal
                    </Badge>
                  )}

                  {/* Upload status */}
                  {image.isLocal && !image.uploading && braiderId && (
                    <Badge 
                      variant="outline"
                      className="absolute bottom-2 right-2 bg-yellow-100 text-yellow-700 border-yellow-200 text-xs"
                    >
                      Pendente
                    </Badge>
                  )}

                  {/* Move indicator */}
                  {!readonly && (
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Move className="h-4 w-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Messages */}
      {images.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-700">
            Adicione imagens ao seu portfólio para destacar seus trabalhos. A primeira imagem será a principal.
          </p>
        </div>
      )}

      {images.length >= maxImages && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-700">
            Limite máximo de {maxImages} imagens atingido.
          </p>
        </div>
      )}

      {/* Upload tips */}
      {!readonly && (
        <div className="space-y-2 text-xs text-gray-600">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Arraste as imagens para reordenar
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            A primeira imagem será a principal do seu perfil
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Use imagens de alta qualidade para melhor impressão
          </p>
        </div>
      )}
    </div>
  )
}