"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, Shield, ArrowRight } from "lucide-react"

interface LoginRequiredProps {
  title?: string
  description?: string
  callbackUrl?: string
}

export default function LoginRequired({ 
  title = "Login Necessário",
  description = "Você precisa estar logado para acessar esta página.",
  callbackUrl = "/register-braider"
}: LoginRequiredProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-brand-600 to-accent-600 text-white p-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading">{title}</CardTitle>
          <CardDescription className="text-white/90 text-base">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Para se registrar como trancista, você precisa primeiro ter uma conta na plataforma.
            </p>
            
            <div className="space-y-3">
              <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="block">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar na Minha Conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500">ou</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              
              <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="block">
                <Button 
                  variant="outline"
                  className="w-full h-12 border-2 border-accent-500 text-accent-600 hover:bg-accent-50 rounded-xl font-semibold transition-all duration-300"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Criar Nova Conta
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Por que preciso de uma conta?</p>
                <p className="text-blue-700">
                  Ter uma conta garante a segurança e qualidade da nossa plataforma, 
                  permitindo que validemos todas as trancistas antes da aprovação.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}