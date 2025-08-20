"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { djangoAPI } from "@/lib/django-api"
import { useAuth } from "@/context/django-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, RefreshCw, Shield, CheckCircle } from "lucide-react"
import SiteHeader from "@/components/site-header"
import Image from "next/image"

export default function VerifyEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [resendMessage, setResendMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { setUser, setIsAuthenticated } = useAuth()

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      router.push('/register')
    }
  }, [searchParams, router])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const verificationCode = code.join('')
    
    if (verificationCode.length !== 6) {
      setError("Por favor, insira o código completo")
      setLoading(false)
      return
    }

    try {
      const response = await djangoAPI.verifyEmail(email, verificationCode)

      if (response.success && response.data) {
        // Email verified successfully and user is now logged in
        setUser(response.data.user)
        setIsAuthenticated(true)
        router.push('/dashboard?message=Email verificado com sucesso! Bem-vindo!')
      } else {
        setError(response.error || 'Código inválido ou expirado')
      }
    } catch (error) {
      setError("Erro ao verificar código")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setResendMessage("")
    setError(null)

    try {
      const response = await djangoAPI.resendVerification(email)

      if (response.success) {
        setResendMessage("Novo código enviado para seu email!")
        setCode(["", "", "", "", "", ""]) // Clear current code
        inputRefs.current[0]?.focus()
      } else {
        setError(response.error || 'Erro ao reenviar código')
      }
    } catch (error) {
      setError("Erro ao reenviar código")
    } finally {
      setResendLoading(false)
    }
  }

  if (!email) {
    return <div>Carregando...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image
                src="/wilnara-logo.png"
                alt="Wilnara Tranças Logo"
                width={60}
                height={60}
                className="rounded-full border-2 border-white/30"
                unoptimized={true}
              />
              <span className="text-3xl font-bold font-heading text-accent-300">WILNARA TRANÇAS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              Verificar{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Email
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Estamos quase lá! Verifique seu email para ativar sua conta
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-16 relative z-10">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-3xl font-bold font-heading text-gray-900">
                Verificar Email
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Enviamos um código de 6 dígitos para<br />
                <strong className="text-gray-900">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <form onSubmit={handleVerifyEmail} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900 text-center block">
                    Código de Verificação
                  </Label>
                  <div className="flex justify-center gap-3">
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { if (el) inputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-14 h-14 text-center text-xl font-bold bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 transition-all duration-300"
                      />
                    ))}
                  </div>
                </div>
              
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm text-center font-medium">{error}</p>
                  </div>
                )}
                {resendMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-700 text-sm text-center font-medium">{resendMessage}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verificando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Verificar Email</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  Não recebeu o código?{" "}
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    className="p-0 h-auto text-accent-600 hover:text-accent-700 font-semibold transition-colors"
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      "Reenviar código"
                    )}
                  </Button>
                </div>

                <div className="text-gray-600">
                  <Link 
                    href="/register" 
                    className="text-accent-600 hover:text-accent-700 font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao registro
                  </Link>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Verificação segura</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={40}
              height={40}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-2xl font-bold font-heading text-accent-300">WILNARA TRANÇAS</span>
          </div>
          <p className="text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}