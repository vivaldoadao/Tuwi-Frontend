'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void
  maxImages?: number
  maxSize?: number // em MB
  accept?: string
  className?: string
}

export function ImageUpload({
  onImagesChange,
  maxImages = 3,
  maxSize = 5,
  accept = "image/*",
  className
}: ImageUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    // Validation
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: "Muitas imagens",
        description: `Máximo de ${maxImages} imagens permitido`,
        variant: "destructive"
      })
      return
    }

    for (const file of fileArray) {
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `Tamanho máximo: ${maxSize}MB`,
          variant: "destructive"
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: "Apenas imagens são permitidas",
          variant: "destructive"
        })
        return
      }
    }

    setUploading(true)

    try {
      const newImages: string[] = []
      
      for (const file of fileArray) {
        // Simular upload para Supabase Storage
        // Em produção, você faria upload real aqui
        const reader = new FileReader()
        const imageUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
        
        newImages.push(imageUrl)
      }

      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange(updatedImages)

      toast({
        title: "Imagens carregadas",
        description: `${newImages.length} ${newImages.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'}`
      })

    } catch (error) {
      console.error('Error uploading images:', error)
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload das imagens",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600">Fazendo upload...</p>
          </div>
        ) : images.length >= maxImages ? (
          <div className="space-y-2">
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto" />
            <p className="text-sm text-orange-600">
              Limite de {maxImages} imagens atingido
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Arraste imagens aqui ou{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => fileInputRef.current?.click()}
                >
                  clique para selecionar
                </Button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Máximo {maxImages} imagens • {maxSize}MB cada • PNG, JPG, WEBP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={uploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          
          {/* Add more button */}
          {images.length < maxImages && (
            <button
              type="button"
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Adicionar</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}