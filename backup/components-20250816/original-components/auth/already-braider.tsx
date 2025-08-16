"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, LayoutDashboard, Edit, ArrowRight } from "lucide-react"

interface AlreadyBraiderProps {
  status: "pending" | "approved" | "rejected"
  braiderName?: string
}

export default function AlreadyBraider({ status, braiderName }: AlreadyBraiderProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle,
          title: "Você já é uma Trancista Aprovada!",
          description: "Seu perfil foi aprovado e está ativo na plataforma.",
          badgeColor: "bg-green-100 text-green-800 border-green-200",
          badgeText: "Aprovada",
          bgGradient: "from-green-50 to-emerald-50",
          actions: [
            {
              label: "Acessar Meu Dashboard",
              href: "/dashboard/braider",
              icon: LayoutDashboard,
              primary: true
            },
            {
              label: "Editar Meu Perfil",
              href: "/profile/braider",
              icon: Edit,
              primary: false
            }
          ]
        }
      case "pending":
        return {
          icon: Clock,
          title: "Aguardando Aprovação",
          description: "Seu cadastro foi enviado e está sendo analisado pela nossa equipe.",
          badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
          badgeText: "Pendente",
          bgGradient: "from-yellow-50 to-amber-50",
          actions: [
            {
              label: "Ver Status da Solicitação",
              href: "/profile/braider-status",
              icon: Clock,
              primary: true
            }
          ]
        }
      case "rejected":
        return {
          icon: XCircle,
          title: "Solicitação Rejeitada",
          description: "Infelizmente sua solicitação não foi aprovada. Você pode tentar novamente.",
          badgeColor: "bg-red-100 text-red-800 border-red-200",
          badgeText: "Rejeitada",
          bgGradient: "from-red-50 to-rose-50",
          actions: [
            {
              label: "Ver Motivo da Rejeição",
              href: "/profile/braider-status",
              icon: XCircle,
              primary: true
            },
            {
              label: "Solicitar Nova Análise",
              href: "/register-braider?reapply=true",
              icon: ArrowRight,
              primary: false
            }
          ]
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl overflow-hidden">
        <CardHeader className={`text-center bg-gradient-to-r ${config.bgGradient} p-8`}>
          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-4">
            <StatusIcon className="h-8 w-8 text-gray-700" />
          </div>
          
          <Badge className={`${config.badgeColor} border text-sm px-3 py-1 mb-4`}>
            {config.badgeText}
          </Badge>
          
          <CardTitle className="text-2xl font-bold font-heading text-gray-900">
            {config.title}
          </CardTitle>
          <CardDescription className="text-gray-700 text-base">
            {config.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          {braiderName && (
            <div className="text-center">
              <p className="text-gray-600">
                Olá, <span className="font-semibold text-brand-700">{braiderName}</span>!
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {config.actions.map((action, index) => (
              <Link key={index} href={action.href as any} className="block">
                <Button 
                  className={
                    action.primary 
                      ? "w-full h-12 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      : "w-full h-12 border-2 border-brand-200 text-brand-600 hover:bg-brand-50 rounded-xl font-semibold transition-all duration-300"
                  }
                  variant={action.primary ? "default" : "outline"}
                >
                  <action.icon className="mr-2 h-5 w-5" />
                  {action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
          
          {status === "pending" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Tempo de Análise</p>
                  <p className="text-blue-700">
                    Nossa equipe analisa todas as solicitações em até 48 horas úteis. 
                    Você receberá um email quando houver atualizações.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {status === "rejected" && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="h-3 w-3 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-orange-900 mb-1">Próximos Passos</p>
                  <p className="text-orange-700">
                    Verifique os motivos da rejeição e corrija as informações necessárias 
                    antes de enviar uma nova solicitação.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
              ← Voltar ao início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}