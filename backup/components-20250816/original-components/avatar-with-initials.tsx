"use client"

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AvatarWithInitialsProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  onAvatarChange?: (newAvatarUrl: string) => void
  className?: string
  userEmail?: string
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-16 h-16 text-lg',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-32 h-32 text-4xl'
}

const buttonSizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-8 h-8', 
  xl: 'w-10 h-10'
}

export default function AvatarWithInitials({
  name,
  avatarUrl,
  size = 'lg',
  editable = false,
  onAvatarChange,
  className,
  userEmail
}: AvatarWithInitialsProps) {
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate initials from name
  const getInitials = (fullName: string) => {
    if (!fullName) return '?'
    
    const names = fullName.trim().split(' ')
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    
    // Take first letter of first name and first letter of last name
    const firstInitial = names[0].charAt(0).toUpperCase()
    const lastInitial = names[names.length - 1].charAt(0).toUpperCase()
    
    return `${firstInitial}${lastInitial}`
  }

  // Generate consistent background color based on name
  const getBackgroundColor = (fullName: string) => {
    if (!fullName) return 'bg-gray-400'
    
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500'
    ]
    
    // Use name length and character codes to determine color consistently
    const nameHash = fullName.split('').reduce((hash, char) => {
      return hash + char.charCodeAt(0)
    }, 0)
    
    return colors[nameHash % colors.length]
  }

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.')
      return
    }

    setUploading(true)

    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        headers: {
          'x-user-email': userEmail || 'unknown@example.com'
        },
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setImageError(false)
        onAvatarChange?.(result.avatarUrl)
      } else {
        console.error('Error uploading avatar:', result.error)
        alert(`Erro ao fazer upload: ${result.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Erro inesperado durante o upload. Tente novamente.')
    } finally {
      setUploading(false)
      // Clear the input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [onAvatarChange])

  const handleImageError = () => {
    setImageError(true)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const initials = getInitials(name)
  const bgColor = getBackgroundColor(name)
  const showImage = avatarUrl && !imageError

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      )}

      {/* Avatar */}
      <div className={cn(
        'relative rounded-full flex items-center justify-center font-bold text-white overflow-hidden border-2 border-white/20 shadow-lg',
        sizeClasses[size],
        !showImage && bgColor
      )}>
        {showImage ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized={true}
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Edit button */}
      {editable && (
        <Button
          size="icon"
          onClick={handleUploadClick}
          disabled={uploading}
          className={cn(
            'absolute -bottom-2 -right-2 bg-white text-purple-500 hover:bg-gray-100 rounded-full shadow-lg',
            buttonSizeClasses[size]
          )}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}