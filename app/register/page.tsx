"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/django-auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LogIn, Eye, EyeOff, User, Mail, Lock, ArrowRight, Shield, UserPlus } from "lucide-react"
import SiteHeader from "@/components/site-header"
import Image from "next/image"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { register } = useAuth()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      setLoading(false)
      return
    }

    try {
      const result = await register({
        name,
        email,
        password,
      })

      if (result.success) {
        if (result.requiresVerification) {
          // Redirecionar para página de verificação
          router.push(`/verify-email?email=${encodeURIComponent(result.email || email)}`)
        } else {
          // Login direto (caso especial)
          router.push("/")
        }
      } else {
        setError("Erro ao criar conta")
      }
    } catch (error) {
      setError("Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      // TODO: Implementar Google OAuth com Django quando necessário
      setError("Login com Google será implementado em breve")
      setLoading(false)
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
              Junte-se à nossa{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Comunidade!
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Crie sua conta e descubra o mundo das tranças com as melhores profissionais
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-16 relative z-10">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-accent-600" />
              </div>
              <CardTitle className="text-3xl font-bold font-heading text-gray-900">Criar Conta</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Junte-se a milhares de pessoas que já fazem parte da nossa comunidade
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
                  <span className="bg-white px-4 text-gray-500 font-medium">Ou crie sua conta</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 transition-all duration-300"
                  />
                </div>
                
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
                  <Label htmlFor="password" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
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
                  
                  {/* Regras de senha */}
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">A senha deve ter:</p>
                    <ul className="space-y-1">
                      <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="text-xs">•</span> Pelo menos 8 caracteres
                      </li>
                      <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="text-xs">•</span> Letras maiúsculas e minúsculas
                      </li>
                      <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="text-xs">•</span> Pelo menos um número
                      </li>
                      <li className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="text-xs">•</span> Pelo menos um símbolo especial
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita sua senha"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Criando conta...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Criar Conta</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  Já tem uma conta?{" "}
                  <Link 
                    href="/login" 
                    className="text-accent-600 hover:text-accent-700 font-semibold transition-colors"
                  >
                    Faça login aqui
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