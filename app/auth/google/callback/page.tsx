"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/context/django-auth-context"
import { toast } from "react-hot-toast"
import SiteHeader from "@/components/site-header"

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, setUser, setIsAuthenticated } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams?.get('code')
        const error = searchParams?.get('error')
        const errorDescription = searchParams?.get('error_description')

        if (error) {
          setStatus('error')
          setError(errorDescription || error)
          return
        }

        if (!code) {
          setStatus('error')
          setError('Código de autorização não encontrado')
          return
        }

        console.log('🔐 Processando código do Google OAuth:', code)

        // Send code to our API to authenticate with Django
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro na autenticação')
        }

        console.log('✅ Autenticação Google bem-sucedida:', data)

        // Store tokens and user data
        if (data.tokens && data.user) {
          localStorage.setItem('access_token', data.tokens.access)
          localStorage.setItem('refresh_token', data.tokens.refresh)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // Update auth context manually for OAuth
          setUser(data.user)
          setIsAuthenticated(true)
          
          setStatus('success')
          toast.success(`Bem-vindo(a), ${data.user.name}! 🎉`)
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/profile')
          }, 2000)
        } else {
          throw new Error('Dados de autenticação inválidos')
        }

      } catch (error) {
        console.error('❌ Erro no callback do Google:', error)
        setStatus('error')
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
        toast.error('Erro na autenticação com Google')
      }
    }

    handleCallback()
  }, [searchParams, router, login])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
              {status === 'loading' && (
                <div className="bg-blue-100">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold font-heading text-gray-900">
              {status === 'loading' && 'Autenticando...'}
              {status === 'success' && 'Login Realizado!'}
              {status === 'error' && 'Erro na Autenticação'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'loading' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Processando sua autenticação com Google...
                </p>
                <div className="animate-pulse">
                  <div className="h-2 bg-blue-200 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Login realizado com sucesso! Redirecionando para seu perfil...
                </p>
                <div className="text-green-600 text-sm">
                  🎉 Bem-vindo(a) à plataforma Tuwi!
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div>
                <p className="text-red-600 mb-4">
                  {error || 'Ocorreu um erro durante a autenticação'}
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl"
                >
                  Voltar ao Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}