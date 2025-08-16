"use client"

import { useEffect, useCallback, useState, useRef } from 'react'
import { useAuth } from '@/context/auth-context'

interface UserPresence {
  user_id: string
  is_online: boolean
  last_seen: string
  last_activity: string
}

interface UseUserPresenceReturn {
  isOnline: boolean
  lastSeen: string | null
  setUserOnline: () => Promise<void>
  setUserOffline: () => Promise<void>
  getUserPresence: (userId: string) => UserPresence | null
  getMultiplePresence: (userIds: string[]) => UserPresence[]
  updateActivity: () => Promise<void>
  loadUserPresence: (userId: string) => Promise<UserPresence | null>
}

export const useUserPresence = (): UseUserPresenceReturn => {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [presenceCache, setPresenceCache] = useState<Map<string, UserPresence>>(new Map())
  
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)

  // Atualizar atividade do usuário
  const updateActivity = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/user-presence/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isOnline: true,
          userAgent: navigator.userAgent
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsOnline(true)
        setLastSeen(new Date().toISOString())
        console.log('✅ User presence updated successfully:', user.email)
      } else {
        console.error('❌ Error updating user activity:', result.error)
      }
    } catch (error) {
      console.error('❌ Error updating user activity:', error)
    }
  }, [user?.id, user?.email])

  // Marcar usuário como online
  const setUserOnline = useCallback(async () => {
    if (!user?.id) return

    try {
      console.log('✅ Setting user online:', user.email)
      await updateActivity()
      
      // Iniciar heartbeat para manter online
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
      
      heartbeatInterval.current = setInterval(() => {
        updateActivity()
      }, 30000) // Atualizar a cada 30 segundos

    } catch (error) {
      console.error('❌ Error setting user online:', error)
    }
  }, [user?.id, user?.email, updateActivity])

  // Marcar usuário como offline
  const setUserOffline = useCallback(async () => {
    if (!user?.id) return

    try {
      console.log('📴 Setting user offline:', user.email)
      
      const response = await fetch('/api/user-presence/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsOnline(false)
        console.log('✅ User set offline successfully')
      } else {
        console.log('⚠️ Could not set user offline:', result.error)
      }

      // Limpar heartbeat
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
        heartbeatInterval.current = null
      }
    } catch (error) {
      console.log('⚠️ Error setting user offline (non-critical):', error)
    }
  }, [user?.id, user?.email])

  // Obter presença de um usuário específico
  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return presenceCache.get(userId) || null
  }, [presenceCache])

  // Obter presença de múltiplos usuários
  const getMultiplePresence = useCallback((userIds: string[]): UserPresence[] => {
    return userIds.map(id => presenceCache.get(id)).filter(Boolean) as UserPresence[]
  }, [presenceCache])

  // Carregar presença de um usuário específico do banco de dados
  const loadUserPresence = useCallback(async (userId: string): Promise<UserPresence | null> => {
    try {
      const response = await fetch('/api/user-presence/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [userId]
        }),
      })

      const result = await response.json()

      if (!result.success || !result.presence || result.presence.length === 0) {
        console.log(`⚠️ No presence data found for user ${userId}`)
        return null
      }

      const presence = result.presence[0] as UserPresence
      
      // Update cache
      setPresenceCache(prev => {
        const newCache = new Map(prev)
        newCache.set(userId, presence)
        return newCache
      })

      console.log(`👥 Loaded presence for user ${userId}:`, presence)
      return presence
    } catch (error) {
      console.error('❌ Error loading user presence:', error)
      return null
    }
  }, [])

  // Polling para atualizar cache de presença de outros usuários
  useEffect(() => {
    if (!user?.id) return

    const pollingInterval = setInterval(async () => {
      // Get all cached user IDs and refresh their presence
      const userIds = Array.from(presenceCache.keys())
      if (userIds.length > 0) {
        try {
          const response = await fetch('/api/user-presence/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds }),
          })
          const result = await response.json()
          if (result.success && result.presence) {
            setPresenceCache(prev => {
              const newCache = new Map(prev)
              result.presence.forEach((p: UserPresence) => {
                newCache.set(p.user_id, p)
              })
              return newCache
            })
            console.log('🔄 Presence cache updated via polling')
          }
        } catch (error) {
          console.log('⚠️ Polling failed:', error)
        }
      }
    }, 10000) // Poll every 10 seconds

    return () => {
      clearInterval(pollingInterval)
    }
  }, [user?.id, presenceCache])

  // Configurar presence quando componente monta
  useEffect(() => {
    if (user?.id && !isInitialized.current) {
      isInitialized.current = true
      setUserOnline()
    }

    // Cleanup quando componente desmonta ou usuário sai
    return () => {
      if (user?.id && isInitialized.current) {
        setUserOffline()
        isInitialized.current = false
      }
    }
  }, [user?.id, setUserOnline, setUserOffline])

  // Detectar quando usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        // Usar navigator.sendBeacon para garantir que a requisição seja enviada
        const data = new FormData()
        data.append('userId', user.id)
        navigator.sendBeacon('/api/user-presence/offline', data)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setUserOffline()
      } else if (document.visibilityState === 'visible') {
        setUserOnline()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, setUserOnline, setUserOffline])

  // Detectar interação do usuário para atualizar atividade
  useEffect(() => {
    if (!user?.id) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    let activityTimeout: NodeJS.Timeout

    const handleActivity = () => {
      clearTimeout(activityTimeout)
      activityTimeout = setTimeout(() => {
        updateActivity()
      }, 5000) // Debounce de 5 segundos
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearTimeout(activityTimeout)
    }
  }, [user?.id, updateActivity])

  return {
    isOnline,
    lastSeen,
    setUserOnline,
    setUserOffline,
    getUserPresence,
    getMultiplePresence,
    updateActivity,
    loadUserPresence
  }
}