"use client"

import { useUserPresence } from '@/hooks/useUserPresenceSimple'

interface PresenceProviderProps {
  children: React.ReactNode
}

export default function PresenceProvider({ children }: PresenceProviderProps) {
  // Just initialize the presence hook - it handles everything automatically
  useUserPresence()
  
  return <>{children}</>
}