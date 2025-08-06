"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Mail, Home, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function BraiderRegistrationSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const braiderName = searchParams.get('name') || 'Trancista'

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Success Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-4">
              🎉 Parabéns,{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {braiderName}!
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed">
              Seu cadastro como trancista foi enviado com sucesso! Nossa equipe irá analisar sua solicitação 
              e entraremos em contato em breve.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-16 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Status Atual */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Status Atual</h3>
                <p className="text-yellow-700 font-semibold mb-2">⏳ Aguardando Análise</p>
                <p className="text-sm text-gray-600">
                  Seu cadastro está na fila de aprovação de nossa equipe
                </p>
              </CardContent>
            </Card>

            {/* Tempo de Análise */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Prazo de Resposta</h3>
                <p className="text-blue-700 font-semibold mb-2">📅 Até 48 horas úteis</p>
                <p className="text-sm text-gray-600">
                  Você receberá um email com o resultado da análise
                </p>
              </CardContent>
            </Card>

            {/* Próximos Passos */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Após Aprovação</h3>
                <p className="text-purple-700 font-semibold mb-2">🚀 Acesso ao Dashboard</p>
                <p className="text-sm text-gray-600">
                  Você poderá gerenciar seus serviços e agendamentos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 max-w-4xl mx-auto">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold font-heading text-gray-900">
                O que acontece agora?
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Entenda todo o processo de aprovação do seu cadastro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              
              {/* Process Steps */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">✅ Cadastro Enviado</h4>
                    <p className="text-gray-600">Seus dados foram registrados com sucesso em nossa plataforma</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">🔍 Análise em Andamento</h4>
                    <p className="text-gray-600">Nossa equipe está revisando suas informações e experiência profissional</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-500 mb-1">📧 Notificação por Email</h4>
                    <p className="text-gray-500">Você receberá o resultado da análise em seu email cadastrado</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <Home className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-500 mb-1">🎯 Acesso ao Dashboard</h4>
                    <p className="text-gray-500">Após aprovação, você terá acesso completo ao painel de trancista</p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Importante lembrar:
                </h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Verifique sua caixa de entrada e spam regularmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Mantenha seus dados de contato atualizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Em caso de dúvidas, entre em contato conosco</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button
                  asChild
                  className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/">
                    <Home className="mr-2 h-5 w-5" />
                    Voltar ao Início
                  </Link>
                </Button>
                
                <Button
                  asChild
                  variant="outline"
                  className="border-accent-300 text-accent-700 hover:bg-accent-50 px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300"
                >
                  <Link href="/braiders">
                    Ver Trancistas
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
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