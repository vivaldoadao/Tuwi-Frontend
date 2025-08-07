"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useNotificationHelpers } from "@/hooks/use-notification-helpers"

/**
 * Página para lidar com callbacks de autenticação (especialmente Google)
 * e redirecionar para o dashboard correto baseado na role
 */
export default function AuthCallbackPage() {
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const { notifyWelcome } = useNotificationHelpers()

  useEffect(() => {
    if (!isLoading && session?.user) {
      // Mostrar notificação de boas-vindas
      if (session.user.name) {
        notifyWelcome(session.user.name)
      }

      // Redirecionar baseado na role
      const redirectPath = 
        session.user.role === "admin" ? "/dashboard" :
        session.user.role === "braider" ? "/braider-dashboard" :
        "/"

      console.log("Auth callback - User role:", session.user.role)
      console.log("Auth callback - Redirecting to:", redirectPath)

      setTimeout(() => {
        router.push(redirectPath as any)
      }, 1500) // Dar tempo para mostrar a mensagem de loading
      
    } else if (!isLoading && !session) {
      // Se não há sessão, voltar para login
      router.push("/login" as any)
    }
  }, [session, isLoading, router, notifyWelcome])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 to-accent-50">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600 mx-auto"></div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Finalizando login...</h1>
            <p className="text-gray-600">Por favor aguarde, estamos configurando sua conta.</p>
          </div>
        </div>
      </div>
    )
  }

  if (session?.user) {
    const roleName = 
      session.user.role === "admin" ? "administrador" :
      session.user.role === "braider" ? "trancista" :
      "cliente"

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 to-accent-50">
        <div className="text-center space-y-6">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Bem-vinda, {session.user.name}!
            </h1>
            <p className="text-gray-600">
              Redirecionando para sua área {roleName}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <div className="w-8 h-8 bg-red-500 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Erro no login</h1>
          <p className="text-gray-600">Houve um problema com sua autenticação.</p>
        </div>
      </div>
    </div>
  )
}