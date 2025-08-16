"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2,
  AlertCircle,
  Check,
  Link
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface ImageUploadPreviewProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  placeholder?: string
  className?: string
}

export function ImageUploadPreview({ 
  value, 
  onChange, 
  folder = 'cms',
  label = 'Imagem',
  placeholder = 'URL da imagem ou faça upload',
  className = ''
}: ImageUploadPreviewProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    // Validações no frontend
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 5MB permitido')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro no upload')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Upload realizado com sucesso!')

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }, [folder, onChange])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={clearImage}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={uploading ? undefined : openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Fazendo upload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:underline">
                  Clique para fazer upload
                </span>
                <span> ou arraste a imagem aqui</span>
              </div>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP ou GIF (máx. 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {value && !uploading && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview:</Label>
          <div className="relative bg-gray-100 rounded-xl overflow-hidden border">
            {value.startsWith('http') || value.startsWith('/') ? (
              <div className="relative w-full aspect-video">
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={() => {
                    toast.error('Erro ao carregar imagem')
                  }}
                />
                <div className="absolute top-2 right-2">
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Carregada
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">URL inválida</p>
                </div>
              </div>
            )}
          </div>
          
          {/* URL Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <Link className="h-3 w-3" />
            <span className="font-mono break-all">{value}</span>
          </div>
        </div>
      )}
    </div>
  )
}