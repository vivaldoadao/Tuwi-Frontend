"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Session } from "next-auth"

interface AuthContextType {
  session: Session | null
  isLoading: boolean
  user: Session['user'] | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  // Automatically initialize user presence when user logs in
  useEffect(() => {
    const initializePresence = async () => {
      if (session?.user?.id && !isLoading) {
        try {
          // Set user online automatically on login
          const response = await fetch('/api/user-presence/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: session.user.id,
              isOnline: true,
              userAgent: navigator.userAgent
            }),
          })

          const result = await response.json()
          if (result.success) {
            console.log('✅ User presence initialized automatically:', session.user.email)
          }
        } catch (error) {
          console.error('⚠️ Failed to initialize user presence:', error)
        }
      }
    }

    initializePresence()
  }, [session?.user?.id, session?.user?.email, isLoading])

  const value = {
    session,
    isLoading,
    user: session?.user || null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
