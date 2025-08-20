"use client"

import { useEffect, useCallback, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// PRESENÇA DE USUÁRIO TEMPORARIAMENTE DESABILITADA
const USER_PRESENCE_DISABLED = true

export const useUserPresence = (): UseUserPresenceReturn => {
  // Se presença estiver desabilitada, retornar valores padrão
  if (USER_PRESENCE_DISABLED) {
    return {
      isOnline: false,
      lastSeen: null,
      setUserOnline: async () => {},
      setUserOffline: async () => {},
      getUserPresence: () => null,
      getMultiplePresence: () => [],
      updateActivity: async () => {},
      loadUserPresence: async () => null
    }
  }
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [presenceCache, setPresenceCache] = useState<Map<string, UserPresence>>(new Map())
  
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const presenceChannel = useRef<any>(null)
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
  }, [user?.id])

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
  }, [user?.id, updateActivity])

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
  }, [user?.id])

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

  // Configurar subscription para mudanças de presença (com fallback para polling)
  useEffect(() => {
    if (!user?.id) return

    let pollingInterval: NodeJS.Timeout
    let setupTimeout: NodeJS.Timeout

    const setupSubscription = () => {
      if (isInitialized.current) return
      
      console.log('🔌 Setting up presence subscription for user:', user.email)
      isInitialized.current = true

      // Subscribe to presence changes with a unique channel name
      const channelName = `presence_${user.id}`
      presenceChannel.current = supabase
        .channel(channelName)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence'
          },
          (payload) => {
            console.log('👥 Presence change:', payload.new)
            
            const presence = payload.new as UserPresence
            if (presence) {
              setPresenceCache(prev => {
                const newCache = new Map(prev)
                newCache.set(presence.user_id, presence)
                return newCache
              })

              // Se é a própria presença do usuário
              if (presence.user_id === user.id) {
                setIsOnline(presence.is_online)
                setLastSeen(presence.last_seen)
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Presence subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Presence subscription established successfully')
            // Clear polling since real-time is working
            if (pollingInterval) {
              clearInterval(pollingInterval)
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.log('⚠️ Presence subscription failed, falling back to polling')
            // Start polling as fallback
            if (!pollingInterval) {
              pollingInterval = setInterval(async () => {
                // Refresh presence cache periodically
                const allUserIds = Array.from(presenceCache.keys())
                if (allUserIds.length > 0) {
                  try {
                    const response = await fetch('/api/user-presence/get', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userIds: allUserIds }),
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
                    }
                  } catch (error) {
                    console.log('⚠️ Polling failed:', error)
                  }
                }
              }, 15000) // Poll every 15 seconds
            }
          }
        })
    }

    // Debounce subscription setup to avoid rapid reconnects
    setupTimeout = setTimeout(() => {
      setupSubscription()
    }, 1000) // Wait 1 second before setting up

    return () => {
      console.log('🔌 Cleaning up presence subscription')
      if (setupTimeout) {
        clearTimeout(setupTimeout)
      }
      if (presenceChannel.current) {
        supabase.removeChannel(presenceChannel.current)
        presenceChannel.current = null
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      isInitialized.current = false
    }
  }, [user?.id, user?.email])

  // Configurar presence quando componente monta
  useEffect(() => {
    if (user?.id) {
      setUserOnline()
    }

    // Cleanup quando componente desmonta ou usuário sai
    return () => {
      if (user?.id) {
        setUserOffline()
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
      }, 1000) // Debounce de 1 segundo
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