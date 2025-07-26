"use client"

import type React from "react"
import { createContext, useContext } from "react"
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
