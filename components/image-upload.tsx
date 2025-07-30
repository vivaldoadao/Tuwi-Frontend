"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle
} from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxImages?: number
}

export function ImageUpload({ files, onFilesChange, maxImages = 5 }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])

  const createPreviews = useCallback((fileList: File[]) => {
    // Clean up previous previews
    previews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })

    // Create new previews
    const newPreviews = fileList.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }, [previews])

  const handleFileSelect = useCallback((newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return

    const fileArray = Array.from(newFiles)
    const remainingSlots = maxImages - files.length
    
    if (fileArray.length > remainingSlots) {
      toast.error(`Máximo ${maxImages} imagens permitidas. Você pode adicionar apenas ${remainingSlots} mais.`)
      return
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error('Apenas arquivos JPG, PNG, WebP e GIF são permitidos.')
      return
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const oversizedFiles = fileArray.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      toast.error('Cada imagem deve ter no máximo 5MB.')
      return
    }

    const updatedFiles = [...files, ...fileArray]
    onFilesChange(updatedFiles)
    createPreviews(updatedFiles)
    
    toast.success(`${fileArray.length} imagem(ns) selecionada(s)!`)
  }, [files, maxImages, onFilesChange, createPreviews])

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

  const handleRemoveFile = (index: number) => {
    // Revoke the object URL to free memory
    if (previews[index] && previews[index].startsWith('blob:')) {
      URL.revokeObjectURL(previews[index])
    }
    
    // Remove from files array
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
    
    // Update previews
    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
    
    toast.success('Imagem removida')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          Imagens do Produto
        </Label>
        <Badge variant="outline" className="text-xs">
          {files.length}/{maxImages}
        </Badge>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
          dragActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${files.length >= maxImages ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Arraste e solte imagens aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mb-4">
            JPG, PNG, WebP ou GIF (máx. 5MB cada)
          </p>
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="image-upload"
            disabled={files.length >= maxImages}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={files.length >= maxImages}
            className="rounded-xl"
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Imagens
          </Button>
        </div>
      </div>

      {/* Image Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((previewUrl, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={previewUrl}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  unoptimized={true}
                />
              </div>
              
              {/* Image Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="rounded-full w-8 h-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary Image Badge */}
              {index === 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 bg-green-100 text-green-700 border-green-200"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Principal
                </Badge>
              )}
              
              {/* File Info */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                  {files[index]?.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Messages */}
      {files.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-700">
            Adicione pelo menos uma imagem para o produto. A primeira imagem será a principal.
          </p>
        </div>
      )}

      {files.length >= maxImages && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-700">
            Limite máximo de {maxImages} imagens atingido.
          </p>
        </div>
      )}
    </div>
  )
}