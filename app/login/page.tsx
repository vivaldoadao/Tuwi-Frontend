"use client"

import type React from "react"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { useNotificationHelpers } from "@/hooks/use-notification-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { notifyWelcome } = useNotificationHelpers()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciais inválidas")
      } else {
        const session = await getSession()
        
        // Trigger welcome notification
        if (session?.user?.name) {
          notifyWelcome(session.user.name)
        }
        
        if (session?.user?.role === "admin") {
          router.push("/dashboard" as any)
        } else if (session?.user?.role === "braider") {
          router.push("/braider-dashboard" as any)
        } else {
          router.push("/")
        }
      }
    } catch (error) {
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      setError("Erro ao fazer login com Google")
      setLoading(false)
    }
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
              Bem-vinda de{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Volta!
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Acesse sua conta e continue sua jornada no mundo das tranças
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-16 relative z-10">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-accent-600" />
              </div>
              <CardTitle className="text-3xl font-bold font-heading text-gray-900">Entrar</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Entre na sua conta para acessar suas encomendas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline"
                className="w-full h-12 text-base font-semibold rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
              >
                <LogIn className="mr-3 h-5 w-5" />
                Continuar com Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-white px-4 text-gray-500 font-medium">Ou entre com email</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-6">
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
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <Link 
                      href="/reset-password" 
                      className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
                    >
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 pr-12 transition-all duration-300"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
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
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Entrar</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  Não tem uma conta?{" "}
                  <Link 
                    href="/register" 
                    className="text-accent-600 hover:text-accent-700 font-semibold transition-colors"
                  >
                    Cadastre-se aqui
                  </Link>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Seus dados estão seguros conosco</span>
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
