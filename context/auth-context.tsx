"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback } from "react"
import { loginUser, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  isLoading: boolean // Adicionamos o estado de carregamento
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Começa como true

  useEffect(() => {
    // Load user from localStorage on initial mount
    const storedUser = localStorage.getItem("wilnara_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false) // Termina o carregamento após verificar o localStorage
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser(email, password)
    if (result.success && result.user) {
      setUser(result.user)
      localStorage.setItem("wilnara_user", JSON.stringify(result.user))
    }
    return { success: result.success, message: result.message }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("wilnara_user")
  }, [])

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
