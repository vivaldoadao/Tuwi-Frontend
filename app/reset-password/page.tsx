"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Shield, RefreshCw, CheckCircle } from "lucide-react"
import SiteHeader from "@/components/site-header"
import Image from "next/image"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar email de recuperação')
        setLoading(false)
        return
      }

      // Redirect to verification page with email parameter
      router.push(`/reset-password/verify?email=${encodeURIComponent(email)}`)
    } catch (error) {
      setError("Erro ao enviar email de recuperação")
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
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
                Email{" "}
                <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                  Enviado!
                </span>
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Verifique sua caixa de entrada para continuar
              </p>
            </div>
          </div>
        </div>

        <main className="flex-1 -mt-16 relative z-10">
          <div className="container mx-auto px-4 flex items-center justify-center">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-3xl font-bold font-heading text-gray-900">Email Enviado</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Verifique sua caixa de entrada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center p-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <p className="text-gray-700 mb-4">
                    Se o email <strong className="text-gray-900">{email}</strong> estiver cadastrado em nossa base, 
                    você receberá instruções para redefinir sua senha.
                  </p>
                  <p className="text-sm text-gray-600">
                    Não encontrou o email? Verifique sua pasta de spam.
                  </p>
                </div>
                
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </Link>
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
              Recuperar{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Senha
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Não se preocupe, vamos ajudá-la a recuperar o acesso à sua conta
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-16 relative z-10">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-accent-600" />
              </div>
              <CardTitle className="text-3xl font-bold font-heading text-gray-900">Recuperar Senha</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Digite seu email para receber as instruções de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 transition-all duration-300"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm text-center font-medium">{error}</p>
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
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Enviar Email</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  Lembrou da senha?{" "}
                  <Link 
                    href="/login" 
                    className="text-accent-600 hover:text-accent-700 font-semibold transition-colors"
                  >
                    Voltar ao login
                  </Link>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Processo seguro e confiável</span>
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