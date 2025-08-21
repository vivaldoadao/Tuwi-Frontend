"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { 
  X, 
  Star,
  Upload,
  Loader2,
  ImageIcon
} from "lucide-react"
import Image from "next/image"
import { 
  ProductImage, 
  getProductImages, 
  deleteProductImage, 
  updateProductImage 
} from "@/lib/django/products"

interface ProductImageEditorProps {
  productId?: string
  newFiles: File[]
  onNewFilesChange: (files: File[]) => void
  maxImages?: number
}

export function ProductImageEditor({ 
  productId, 
  newFiles, 
  onNewFilesChange, 
  maxImages = 5 
}: ProductImageEditorProps) {
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Load existing images when product ID is provided
  useEffect(() => {
    if (productId) {
      loadExistingImages()
    }
  }, [productId])

  const loadExistingImages = async () => {
    if (!productId) return
    
    setLoading(true)
    try {
      const images = await getProductImages(productId)
      console.log('[ProductImageEditor] Loaded existing images:', images)
      setExistingImages(images)
    } catch (error) {
      console.error('[ProductImageEditor] Error loading images:', error)
      toast.error('Erro ao carregar imagens existentes')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExisting = async (imageId: string) => {
    const result = await deleteProductImage(imageId)
    
    if (result.success) {
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('Imagem deletada com sucesso')
    } else {
      toast.error(result.message || 'Erro ao deletar imagem')
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    const result = await updateProductImage(imageId, { is_primary: true })
    
    if (result.success) {
      setExistingImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      )
      toast.success('Imagem principal definida')
    } else {
      toast.error('Erro ao definir imagem principal')
    }
  }

  const handleNewFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const totalImages = existingImages.length + newFiles.length
    const remainingSlots = maxImages - totalImages
    
    if (fileArray.length > remainingSlots) {
      toast.error(`Máximo ${maxImages} imagens permitidas. Você pode adicionar apenas ${remainingSlots} mais.`)
      return
    }

    // Validate file types and sizes
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`)
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} é muito grande. Máximo 5MB por imagem.`)
        return
      }
    }

    onNewFilesChange([...newFiles, ...fileArray])
  }

  const handleRemoveNewFile = (index: number) => {
    const updatedFiles = newFiles.filter((_, i) => i !== index)
    onNewFilesChange(updatedFiles)
  }

  const totalImages = existingImages.length + newFiles.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Imagens do Produto</h3>
        <Badge variant="secondary">
          {totalImages}/{maxImages} imagens
        </Badge>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Imagens Existentes</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {existingImages.map((image) => (
              <Card key={image.id} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={image.image}
                      alt={image.alt_text || "Imagem do produto"}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Primary badge */}
                    {image.is_primary && (
                      <Badge className="absolute top-1 left-1 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!image.is_primary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSetPrimary(image.id)}
                          title="Definir como principal"
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDeleteExisting(image.id)}
                        title="Deletar imagem"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New Images */}
      {newFiles.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Novas Imagens</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {newFiles.map((file, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Nova imagem ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    <Badge className="absolute top-1 left-1 text-xs bg-green-500">
                      Nova
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveNewFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {totalImages < maxImages && (
        <div>
          <label
            htmlFor="image-upload"
            className={`
              relative block w-full rounded-lg border-2 border-dashed p-6 text-center cursor-pointer
              transition-colors duration-200
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              const files = e.dataTransfer.files
              if (files?.length > 0) {
                handleNewFileSelect({ target: { files } } as any)
              }
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-gray-100 p-3">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Adicionar Imagens
                </p>
                <p className="text-xs text-gray-500">
                  Clique ou arraste até {maxImages - totalImages} imagem(ns)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP até 5MB cada
                </p>
              </div>
            </div>
          </label>
          
          <input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleNewFileSelect}
          />
        </div>
      )}

      {totalImages >= maxImages && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Limite máximo de {maxImages} imagens atingido
          </p>
        </div>
      )}
    </div>
  )
}