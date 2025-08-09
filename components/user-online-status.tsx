"use client"

import { useState, useEffect } from 'react'
import { useUserPresence } from '@/hooks/useUserPresenceSimple'

interface UserOnlineStatusProps {
  userId: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserOnlineStatus({ 
  userId, 
  showLabel = false, 
  size = 'md',
  className = "" 
}: UserOnlineStatusProps) {
  const { getUserPresence, loadUserPresence } = useUserPresence()
  const [presence, setPresence] = useState(getUserPresence(userId))

  // Load presence data when component mounts and periodically
  useEffect(() => {
    const loadAndUpdatePresence = async () => {
      const currentPresence = getUserPresence(userId)
      if (!currentPresence) {
        // Try to load from database if not in cache
        const loadedPresence = await loadUserPresence(userId)
        if (loadedPresence) {
          setPresence(loadedPresence)
        }
      } else {
        setPresence(currentPresence)
      }
    }

    // Load immediately
    loadAndUpdatePresence()

    // Set up periodic updates
    const interval = setInterval(() => {
      loadAndUpdatePresence()
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [userId, getUserPresence, loadUserPresence])

  // Also update immediately when getUserPresence changes
  useEffect(() => {
    const currentPresence = getUserPresence(userId)
    if (JSON.stringify(currentPresence) !== JSON.stringify(presence)) {
      setPresence(currentPresence)
    }
  }, [getUserPresence, userId, presence])

  const isOnline = presence?.is_online || false
  const lastSeen = presence?.last_seen

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const formatLastSeen = (lastSeenDate: string) => {
    const now = new Date()
    const seen = new Date(lastSeenDate)
    const diffInMinutes = Math.floor((now.getTime() - seen.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes < 60) return `Há ${diffInMinutes}m`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Há ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `Há ${diffInDays}d`
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div 
          className={`
            ${sizeClasses[size]} 
            rounded-full 
            ${isOnline 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-gray-400'
            }
            ring-2 ring-white
          `}
        />
        {isOnline && (
          <div 
            className={`
              absolute inset-0 
              ${sizeClasses[size]} 
              bg-green-500 
              rounded-full 
              animate-ping 
              opacity-75
            `}
          />
        )}
      </div>
      
      {showLabel && (
        <span className="text-xs text-gray-600">
          {isOnline ? (
            <span className="text-green-600 font-medium">Online</span>
          ) : lastSeen ? (
            <span>{formatLastSeen(lastSeen)}</span>
          ) : (
            <span>Offline</span>
          )}
        </span>
      )}
    </div>
  )
}